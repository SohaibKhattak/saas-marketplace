<?php
/**
 * Plugin Name: SaaS Marketplace Access Control
 * Description: MU-Plugin that integrates WordPress Multisite with the SaaS Marketplace platform.
 *              Handles subscription-based content gating and SSO via JWT.
 * Version: 1.0.0
 * Author: SaaS Marketplace Team
 * Network: true
 */

if (!defined('ABSPATH')) {
    exit;
}

// ─── Configuration ──────────────────────────────────────────────────────────

define('SAAS_API_URL', getenv('SAAS_API_URL') ?: 'http://localhost:4000/api/v1');
define('SAAS_CACHE_TTL', 300); // 5 minutes

// ─── Subscription Access Check ──────────────────────────────────────────────

/**
 * Check if a user has an active subscription for the current site's product.
 * Results are cached in a transient for SAAS_CACHE_TTL seconds.
 */
function saas_check_subscription($user_email) {
    $blog_id = get_current_blog_id();
    $cache_key = 'saas_access_' . md5($user_email . '_' . $blog_id);
    $cached = get_transient($cache_key);

    if ($cached !== false) {
        return $cached;
    }

    $response = wp_remote_get(
        SAAS_API_URL . '/wp/check-access?' . http_build_query([
            'email'   => $user_email,
            'site_id' => $blog_id,
        ]),
        [
            'timeout' => 5,
            'headers' => [
                'X-WP-Site-ID' => (string) $blog_id,
            ],
        ]
    );

    if (is_wp_error($response)) {
        // On API failure, allow access (fail open for better UX)
        return ['status' => 'active', 'plan' => 'unknown'];
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    $result = $body['data'] ?? ['status' => 'none', 'plan' => null];

    set_transient($cache_key, $result, SAAS_CACHE_TTL);
    return $result;
}

// ─── Content Gating Shortcode ───────────────────────────────────────────────

/**
 * Usage: [saas_content plan="pro"]Premium content here[/saas_content]
 *
 * Shows content only if the logged-in user has a subscription matching
 * the specified plan (or any active subscription if plan is omitted).
 */
function saas_content_shortcode($atts, $content = null) {
    $atts = shortcode_atts(['plan' => ''], $atts, 'saas_content');

    if (!is_user_logged_in()) {
        return saas_render_paywall('Please log in to access this content.');
    }

    $user = wp_get_current_user();
    $access = saas_check_subscription($user->user_email);

    if ($access['status'] === 'active' || $access['status'] === 'trialing') {
        // If a specific plan is required, check it
        if (!empty($atts['plan']) && strtolower($access['plan']) !== strtolower($atts['plan'])) {
            return saas_render_paywall('This content requires the ' . esc_html($atts['plan']) . ' plan. Please upgrade your subscription.');
        }
        return do_shortcode($content);
    }

    return saas_render_paywall('Subscribe to access this content.');
}
add_shortcode('saas_content', 'saas_content_shortcode');

/**
 * Render a styled paywall message with a link to the marketplace.
 */
function saas_render_paywall($message) {
    $frontend_url = getenv('SAAS_FRONTEND_URL') ?: 'http://localhost:3000';
    return sprintf(
        '<div style="padding:24px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;text-align:center;margin:16px 0;">
            <p style="margin:0 0 12px;color:#495057;font-size:16px;">🔒 %s</p>
            <a href="%s/marketplace" style="display:inline-block;padding:10px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
                View Plans
            </a>
        </div>',
        esc_html($message),
        esc_url($frontend_url)
    );
}

// ─── SSO: JWT-based login from marketplace ──────────────────────────────────

/**
 * Handle SSO login via JWT token passed as query parameter.
 * URL: https://dev1.platform.com/?saas_token=<jwt>
 */
function saas_handle_sso() {
    if (!isset($_GET['saas_token']) || is_user_logged_in()) {
        return;
    }

    $token = sanitize_text_field($_GET['saas_token']);

    // Validate token with the platform API
    $response = wp_remote_post(SAAS_API_URL . '/wp/verify-token', [
        'timeout' => 5,
        'headers' => ['Content-Type' => 'application/json'],
        'body'    => json_encode(['token' => $token]),
    ]);

    if (is_wp_error($response)) {
        return;
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);

    if (empty($body['data']['email'])) {
        return;
    }

    $email = sanitize_email($body['data']['email']);
    $user = get_user_by('email', $email);

    if (!$user) {
        // Create WP user for the subscriber
        $user_id = wp_create_user($email, wp_generate_password(), $email);
        if (is_wp_error($user_id)) {
            return;
        }
        $user = get_user_by('id', $user_id);
    }

    // Log in the user
    wp_set_current_user($user->ID);
    wp_set_auth_cookie($user->ID, true);

    // Redirect to remove token from URL
    wp_safe_redirect(remove_query_arg('saas_token'));
    exit;
}
add_action('init', 'saas_handle_sso', 1);
