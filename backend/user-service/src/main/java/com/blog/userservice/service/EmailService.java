package com.blog.userservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    public void sendVerificationEmail(String toEmail, String username, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Verify Your Email - Blog Management System");

            String verificationUrl = baseUrl + "/verify-email?token=" + token;

            String emailContent = String.format("""
                    Hello %s,

                    Thank you for registering with Blog Management System!

                    Please click the link below to verify your email address:
                    %s

                    This link will expire in 24 hours.

                    If you did not create this account, please ignore this email.

                    Best regards,
                    Blog Management Team
                    """, username, verificationUrl);

            message.setText(emailContent);

            mailSender.send(message);
            log.info("Verification email sent successfully to: {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send verification email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    public void sendPasswordChangeNotification(String toEmail, String username) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Password Changed Successfully - Blog Management System");

            String emailContent = String.format("""
                    Hello %s,

                    Your password has been changed successfully.

                    If you did not make this change, please contact us immediately at %s to secure your account.

                    Change details:
                    - Date: %s
                    - IP Address: [Your system logged this change]

                    For security reasons, we recommend:
                    - Use a strong, unique password
                    - Enable two-factor authentication if available
                    - Never share your password with anyone

                    Best regards,
                    Blog Management Team
                    """, username, fromEmail, java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            message.setText(emailContent);

            mailSender.send(message);
            log.info("Password change notification sent successfully to: {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send password change notification to: {}", toEmail, e);
            // Don't throw exception here - password already changed, just log the error
        }
    }
}
