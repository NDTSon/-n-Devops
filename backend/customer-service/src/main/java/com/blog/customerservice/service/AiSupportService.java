package com.blog.customerservice.service;

import com.blog.customerservice.dto.AiAssistRequest;
import com.blog.customerservice.dto.AiAssistResponse;
import com.blog.customerservice.model.AiModelUsageDaily;
import com.blog.customerservice.model.SupportTicket;
import com.blog.customerservice.model.AiSupportSetting;
import com.blog.customerservice.repository.AiModelUsageDailyRepository;
import com.blog.customerservice.repository.AiSupportSettingRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

@Service
@Slf4j
@RequiredArgsConstructor
public class AiSupportService {

    private static final List<String> SUPPORTED_MODELS = List.of(
            "Gemma 3 1B",
            "Gemma 3 2B",
            "Gemma 3 4B",
            "Gemma 3 12B",
            "Gemma 3 27B"
    );

    private static final Map<String, String> PROVIDER_MODEL_IDS = Map.of(
            "Gemma 3 1B", "gemma-3-1b-it",
            "Gemma 3 2B", "gemma-3-2b-it",
            "Gemma 3 4B", "gemma-3-4b-it",
            "Gemma 3 12B", "gemma-3-12b-it",
            "Gemma 3 27B", "gemma-3-27b-it"
    );

    private static final String MODEL_SETTING_KEY = "active_model";
    private static final String MODEL_CATEGORY = "Other models";
    private static final int RPM_LIMIT = 30;
    private static final int TPM_LIMIT = 15_000;
    private static final int RPD_LIMIT = 14_400;

    private final WebClient aiWebClient;
    private final TicketService ticketService;
    private final AiSupportSettingRepository aiSupportSettingRepository;
    private final AiModelUsageDailyRepository aiModelUsageDailyRepository;

    @Value("${ai.api-key:}")
    private String apiKey;

    @Value("${ai.model:}")
    private String model;

    @Value("${ai.chat-path:/chat/completions}")
    private String chatPath;

    @Value("${ai.timeout-seconds:30}")
    private long timeoutSeconds;

    private final AtomicReference<String> activeModel = new AtomicReference<>();
    private final Map<String, Deque<Instant>> rpmWindows = new ConcurrentHashMap<>();
    private final Map<String, Deque<TokenPoint>> tpmWindows = new ConcurrentHashMap<>();

    @PostConstruct
    void initializeModel() {
        String modelFromDb = aiSupportSettingRepository.findBySettingKey(MODEL_SETTING_KEY)
                .map(AiSupportSetting::getSettingValue)
                .orElse(null);

        if (modelFromDb != null && SUPPORTED_MODELS.contains(modelFromDb)) {
            activeModel.set(modelFromDb);
            return;
        }

        if (model != null && SUPPORTED_MODELS.contains(model)) {
            activeModel.set(model);
            persistModel(model);
            return;
        }

        activeModel.set(SUPPORTED_MODELS.get(0));
        persistModel(activeModel.get());
        log.warn("Configured ai.model '{}' is not supported. Falling back to '{}'.", model, activeModel.get());
    }

    public AiAssistResponse askAssistant(UUID currentUserId, String role, AiAssistRequest request) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI integration is not configured. Please set AI_API_KEY.");
        }

        String prompt = buildPrompt(currentUserId, role, request);

        String selectedModel = activeModel.get();
        String providerModelId = PROVIDER_MODEL_IDS.getOrDefault(selectedModel, "gemma-3-1b-it");

        recordRequestAttempt(selectedModel);

        Map<?, ?> response = callProvider(providerModelId, prompt);

        String answer = extractAnswer(response);
        UsageNumbers usageNumbers = extractUsageNumbers(response, prompt, answer);
        recordTokenUsage(selectedModel, usageNumbers);

        return AiAssistResponse.builder()
                .model(selectedModel)
                .answer(answer)
                .build();
    }

    private Map<?, ?> callProvider(String providerModelId, String prompt) {
        String mergedPrompt = "Ban la tro ly ho tro khach hang cho nen tang blog. "
            + "Hay tra loi bang tieng Viet, ngan gon, thuc te.\n\n"
            + "Yeu cau nguoi dung:\n"
            + prompt;

        Map<String, Object> payload = new HashMap<>();
        payload.put("model", providerModelId);
        payload.put("messages", List.of(
            Map.of("role", "user", "content", mergedPrompt)
        ));
        payload.put("temperature", 0.4);

        try {
            return requestProvider(payload);
        } catch (ResponseStatusException e) {
            String reason = e.getReason();
            boolean modelFormatIssue = e.getStatusCode().value() == 400
                    && reason != null
                    && reason.toLowerCase().contains("model")
                    && reason.toLowerCase().contains("format");

            if (modelFormatIssue && !providerModelId.startsWith("models/")) {
                Map<String, Object> retryPayload = new HashMap<>(payload);
                retryPayload.put("model", "models/" + providerModelId);
                return requestProvider(retryPayload);
            }
            throw e;
        }
    }

    private Map<?, ?> requestProvider(Map<String, Object> payload) {
        try {
            return aiWebClient.post()
                    .uri(chatPath)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .header("x-goog-api-key", apiKey)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .block();
        } catch (WebClientResponseException e) {
            String providerBody = e.getResponseBodyAsString();
            HttpStatus status = mapProviderStatus(e.getRawStatusCode());
            log.warn("AI provider returned status {} mapped to {}", e.getRawStatusCode(), status.value());
            throw new ResponseStatusException(
                    status,
                    "AI provider error " + e.getRawStatusCode() + ": " + normalizeProviderError(providerBody)
            );
        }
    }

    public List<String> getSupportedModels() {
        return SUPPORTED_MODELS;
    }

    public String getActiveModel() {
        return activeModel.get();
    }

    public String updateActiveModel(String nextModel) {
        if (nextModel == null || nextModel.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Model is required");
        }
        if (!SUPPORTED_MODELS.contains(nextModel)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Model is not supported");
        }
        activeModel.set(nextModel);
        persistModel(nextModel);
        log.info("AI model switched to {}", nextModel);
        return nextModel;
    }

    public List<Map<String, Object>> getModelStats() {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(27);
        List<AiModelUsageDaily> usageRows = aiModelUsageDailyRepository.findByUsageDateBetween(startDate, today);

        Map<String, long[]> peakMap = new HashMap<>();
        for (AiModelUsageDaily row : usageRows) {
            long[] peaks = peakMap.computeIfAbsent(row.getModelName(), k -> new long[]{0L, 0L, 0L});
            peaks[0] = Math.max(peaks[0], safeInt(row.getPeakRpm()));
            peaks[1] = Math.max(peaks[1], safeLong(row.getPeakTpm()));
            peaks[2] = Math.max(peaks[2], safeLong(row.getRequestCount()));
        }

        return SUPPORTED_MODELS.stream().map(modelName -> {
            long[] peaks = peakMap.getOrDefault(modelName, new long[]{0L, 0L, 0L});
            long rpmUsed = peaks[0];
            long tpmUsed = peaks[1];
            long rpdUsed = peaks[2];

            Map<String, Object> row = new HashMap<>();
            row.put("model", modelName);
            row.put("category", MODEL_CATEGORY);
            row.put("rpmUsed", rpmUsed);
            row.put("rpmLimit", RPM_LIMIT);
            row.put("tpmUsed", tpmUsed);
            row.put("tpmLimit", TPM_LIMIT);
            row.put("rpdUsed", rpdUsed);
            row.put("rpdLimit", RPD_LIMIT);
            row.put("window", "Peak usage over last 28 days");
            return row;
        }).toList();
    }

    private void persistModel(String modelToSave) {
        AiSupportSetting setting = aiSupportSettingRepository.findBySettingKey(MODEL_SETTING_KEY)
                .orElseGet(() -> AiSupportSetting.builder().settingKey(MODEL_SETTING_KEY).build());

        setting.setSettingValue(modelToSave);
        aiSupportSettingRepository.save(setting);
    }

    private void recordRequestAttempt(String modelName) {
        Instant now = Instant.now();
        trackRpm(modelName, now);
        int currentRpm = getCurrentRpm(modelName);

        LocalDate today = LocalDate.now();
        AiModelUsageDaily daily = getOrCreateDailyRecord(modelName, today);
        daily.setRequestCount(safeLong(daily.getRequestCount()) + 1);
        daily.setPeakRpm(Math.max(safeInt(daily.getPeakRpm()), currentRpm));
        aiModelUsageDailyRepository.save(daily);
    }

    private void recordTokenUsage(String modelName, UsageNumbers usageNumbers) {
        Instant now = Instant.now();
        trackTpm(modelName, now, usageNumbers.totalTokens());
        long currentTpm = getCurrentTpm(modelName);

        LocalDate today = LocalDate.now();
        AiModelUsageDaily daily = getOrCreateDailyRecord(modelName, today);
        daily.setPromptTokens(safeLong(daily.getPromptTokens()) + usageNumbers.promptTokens());
        daily.setCompletionTokens(safeLong(daily.getCompletionTokens()) + usageNumbers.completionTokens());
        daily.setTotalTokens(safeLong(daily.getTotalTokens()) + usageNumbers.totalTokens());
        daily.setPeakTpm(Math.max(safeLong(daily.getPeakTpm()), currentTpm));
        aiModelUsageDailyRepository.save(daily);
    }

    private AiModelUsageDaily getOrCreateDailyRecord(String modelName, LocalDate date) {
        return aiModelUsageDailyRepository.findByModelNameAndUsageDate(modelName, date)
                .orElseGet(() -> AiModelUsageDaily.builder()
                        .modelName(modelName)
                        .usageDate(date)
                        .build());
    }

    private void trackRpm(String modelName, Instant now) {
        Deque<Instant> deque = rpmWindows.computeIfAbsent(modelName, k -> new ArrayDeque<>());
        synchronized (deque) {
            pruneRpmWindow(deque, now);
            deque.addLast(now);
        }
    }

    private void trackTpm(String modelName, Instant now, long totalTokens) {
        Deque<TokenPoint> deque = tpmWindows.computeIfAbsent(modelName, k -> new ArrayDeque<>());
        synchronized (deque) {
            pruneTpmWindow(deque, now);
            deque.addLast(new TokenPoint(now, totalTokens));
        }
    }

    private int getCurrentRpm(String modelName) {
        Deque<Instant> deque = rpmWindows.computeIfAbsent(modelName, k -> new ArrayDeque<>());
        synchronized (deque) {
            pruneRpmWindow(deque, Instant.now());
            return deque.size();
        }
    }

    private long getCurrentTpm(String modelName) {
        Deque<TokenPoint> deque = tpmWindows.computeIfAbsent(modelName, k -> new ArrayDeque<>());
        synchronized (deque) {
            pruneTpmWindow(deque, Instant.now());
            return deque.stream().mapToLong(TokenPoint::tokens).sum();
        }
    }

    private void pruneRpmWindow(Deque<Instant> deque, Instant now) {
        Instant threshold = now.minus(1, ChronoUnit.MINUTES);
        while (!deque.isEmpty() && deque.peekFirst().isBefore(threshold)) {
            deque.pollFirst();
        }
    }

    private void pruneTpmWindow(Deque<TokenPoint> deque, Instant now) {
        Instant threshold = now.minus(1, ChronoUnit.MINUTES);
        while (!deque.isEmpty() && deque.peekFirst().timestamp().isBefore(threshold)) {
            deque.pollFirst();
        }
    }

    private UsageNumbers extractUsageNumbers(Map<?, ?> response, String prompt, String answer) {
        long promptTokens;
        long completionTokens;
        long totalTokens;

        Object usageObj = response != null ? response.get("usage") : null;
        if (usageObj instanceof Map<?, ?> usageMap) {
            promptTokens = parseLong(usageMap.get("prompt_tokens"));
            completionTokens = parseLong(usageMap.get("completion_tokens"));
            totalTokens = parseLong(usageMap.get("total_tokens"));
        } else {
            promptTokens = 0;
            completionTokens = 0;
            totalTokens = 0;
        }

        if (promptTokens <= 0) {
            promptTokens = estimateTokenCount(prompt);
        }
        if (completionTokens <= 0) {
            completionTokens = estimateTokenCount(answer);
        }
        if (totalTokens <= 0) {
            totalTokens = promptTokens + completionTokens;
        }

        return new UsageNumbers(promptTokens, completionTokens, totalTokens);
    }

    private long parseLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number number) {
            return Math.max(0L, number.longValue());
        }
        if (value instanceof String text) {
            try {
                return Math.max(0L, Long.parseLong(text));
            } catch (NumberFormatException ignored) {
                return 0L;
            }
        }
        return 0L;
    }

    private long estimateTokenCount(String text) {
        if (text == null || text.isBlank()) {
            return 1L;
        }
        return Math.max(1L, Math.round(text.length() / 4.0));
    }

    private long safeLong(Long value) {
        return value == null ? 0L : value;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private String buildPrompt(UUID currentUserId, String role, AiAssistRequest request) {
        if (request.getTicketId() == null) {
            return request.getQuestion();
        }

        SupportTicket ticket = ticketService.findTicket(request.getTicketId());
        boolean canAccess = isSupportRole(role) || Objects.equals(ticket.getUserId(), currentUserId);
        if (!canAccess) {
            return request.getQuestion();
        }

        return "Ticket subject: " + ticket.getSubject() + "\n"
                + "Ticket description: " + ticket.getDescription() + "\n"
                + "Ticket status: " + ticket.getStatus() + "\n"
                + "User question: " + request.getQuestion();
    }

    @SuppressWarnings("unchecked")
    private String extractAnswer(Map<?, ?> response) {
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI provider returned empty response");
        }

        Object choicesObj = response.get("choices");
        if (!(choicesObj instanceof List<?> choices) || choices.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI provider response does not contain choices");
        }

        Object firstChoice = choices.get(0);
        if (!(firstChoice instanceof Map<?, ?> firstChoiceMap)) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid AI provider response format");
        }

        Object messageObj = firstChoiceMap.get("message");
        if (!(messageObj instanceof Map<?, ?> messageMap)) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid AI provider message format");
        }

        Object content = messageMap.get("content");
        if (!(content instanceof String answer) || answer.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI provider returned empty answer");
        }

        return answer;
    }

    private boolean isSupportRole(String role) {
        if (role == null) {
            return false;
        }
        return "ADMIN".equalsIgnoreCase(role) || "SUPPORT".equalsIgnoreCase(role) || "MODERATOR".equalsIgnoreCase(role);
    }

    private String normalizeProviderError(String providerBody) {
        if (providerBody == null || providerBody.isBlank()) {
            return "No error details from AI provider";
        }
        String compact = providerBody.replaceAll("\\s+", " ").trim();
        if (compact.length() > 300) {
            return compact.substring(0, 300) + "...";
        }
        return compact;
    }

    private HttpStatus mapProviderStatus(int providerStatus) {
        if (providerStatus == 429) {
            return HttpStatus.TOO_MANY_REQUESTS;
        }
        if (providerStatus == 401 || providerStatus == 403) {
            return HttpStatus.SERVICE_UNAVAILABLE;
        }
        if (providerStatus >= 500) {
            return HttpStatus.BAD_GATEWAY;
        }
        return HttpStatus.BAD_GATEWAY;
    }

    private record TokenPoint(Instant timestamp, long tokens) {
    }

    private record UsageNumbers(long promptTokens, long completionTokens, long totalTokens) {
    }
}

