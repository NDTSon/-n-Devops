package com.blog.userservice.security;

import com.blog.userservice.model.User;
import com.blog.userservice.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // Nginx đã xóa X-User-Id và X-User-Role từ client, nên header này chỉ
        // tồn tại khi internal service gọi nhau. Luôn ưu tiên parse JWT trực tiếp.
        String authHeader = request.getHeader("Authorization");
        HttpServletRequest requestToFilter = request;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                String username = jwtUtil.extractUsername(token);

                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    Optional<User> userOptional = userRepository.findByUsername(username);

                    if (userOptional.isPresent() && jwtUtil.validateToken(token, username)) {
                        User user = userOptional.get();

                        // Set request attributes cho các controller dùng getAttribute()
                        request.setAttribute("userId", user.getId());
                        request.setAttribute("role", user.getRole().name());

                        final String injectedUserId = user.getId().toString();
                        final String injectedRole = user.getRole().name();

                        // Wrap request để inject X-User-Id và X-User-Role làm HTTP header
                        // Các controller dùng @RequestHeader("X-User-Id") sẽ đọc được giá trị này
                        requestToFilter = new HttpServletRequestWrapper(request) {
                            @Override
                            public String getHeader(String name) {
                                if ("X-User-Id".equalsIgnoreCase(name)) return injectedUserId;
                                if ("X-User-Role".equalsIgnoreCase(name)) return injectedRole;
                                return super.getHeader(name);
                            }

                            @Override
                            public Enumeration<String> getHeaders(String name) {
                                if ("X-User-Id".equalsIgnoreCase(name) || "X-User-Role".equalsIgnoreCase(name)) {
                                    return Collections.enumeration(Collections.singletonList(getHeader(name)));
                                }
                                return super.getHeaders(name);
                            }
                        };

                        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + injectedRole);
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                Collections.singletonList(authority));

                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(requestToFilter));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            } catch (Exception e) {
                logger.error("JWT validation error: " + e.getMessage());
            }
        }

        filterChain.doFilter(requestToFilter, response);
    }
}
