package Backend.auth.config;

import Backend.auth.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {
    private final UserService userService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public OAuth2LoginSuccessHandler(UserService userService) {
        this.userService = userService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            OAuth2User oauth2User = oauthToken.getPrincipal();
            String email = oauth2User.getAttribute("email");
            String name = oauth2User.getAttribute("name");
            if (email != null) {
                userService.createOAuthStudent(email, name);
            }
        }

        response.sendRedirect(frontendUrl + "/home");
    }
}

