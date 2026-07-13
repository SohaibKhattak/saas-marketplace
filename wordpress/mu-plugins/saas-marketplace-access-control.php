<?php
/**
 * Plugin Name: Saasifyy Access Control
 * Description: Controls access to WordPress subsites based on marketplace subscriptions.
 *              Checks subscription status via the platform API and shows paywall for non-subscribers.
 * Version: 1.0.0
 * Author: Saasifyy Team
 * Network: true
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Only run on subsites, not the main site
if (is_main_site()) {
    return;
}

// Platform API base URL
define('SAAS_API_URL', 'https://api.saasifyy.tech/api/v1');
define('SAAS_PLATFORM_URL', 'https://saasifyy.tech');
define('SAAS_CACHE_TTL', 300); // Cache subscription check for 5 minutes

/**
 * Get the current subsite's subdomain slug.
 */
function saas_get_site_slug() {
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $parts = explode('.', $host);
    if (count($parts) >= 3) {
        return $parts[0];
    }
    return '';
}

/**
 * Check if a user has an active subscription via the platform API.
 * Results are cached using transients for performance.
 */
function saas_check_subscription($user_email, $site_slug) {
    $cache_email = empty($user_email) ? 'guest' : $user_email;
    $cache_key = 'saas_access_' . md5($cache_email . '_' . $site_slug);
    $cached = get_transient($cache_key);
    if ($cached !== false) {
        return $cached;
    }

    $query_args = ['site_slug' => $site_slug];
    if (!empty($user_email)) {
        $query_args['user_email'] = $user_email;
    }

    $url = SAAS_API_URL . '/wp/check-access?' . http_build_query($query_args);

    $response = wp_remote_get($url, [
        'timeout' => 10,
        'headers' => ['Accept' => 'application/json'],
    ]);

    if (is_wp_error($response)) {
        // Fail closed: deny access when API is unreachable
        return ['hasAccess' => false, 'plan' => null, 'productId' => null];
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    $result = $body['data'] ?? ['hasAccess' => false, 'plan' => null, 'productId' => null];

    set_transient($cache_key, $result, SAAS_CACHE_TTL);
    return $result;
}

/**
 * Validate a launch token via the platform API and set a session cookie.
 * Called when a customer clicks "Launch App" and arrives with ?saas_token=xxx
 */
function saas_handle_launch_token() {
    if (empty($_GET['saas_token'])) {
        return false;
    }

    $token = sanitize_text_field($_GET['saas_token']);
    $url = SAAS_API_URL . '/wp/validate-token?' . http_build_query(['token' => $token]);

    $response = wp_remote_get($url, [
        'timeout' => 10,
        'headers' => ['Accept' => 'application/json'],
    ]);

    if (is_wp_error($response)) {
        return false;
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    $data = $body['data'] ?? [];

    if (!empty($data['valid']) && !empty($data['email'])) {
        $email = sanitize_email($data['email']);
        // Set a cookie on the parent domain so it works across subsites
        // Cookie lasts 24 hours — user will need to re-launch after that
        $domain = '.' . preg_replace('/^[^.]+\./', '', $_SERVER['HTTP_HOST']);
        setcookie('saas_user_email', $email, time() + 86400, '/', $domain, true, true);
        $_COOKIE['saas_user_email'] = $email; // Make available immediately for this request

        // Redirect to remove the token from the URL (so it's not bookmarked/shared)
        $clean_url = strtok($_SERVER['REQUEST_URI'], '?');
        wp_redirect('https://' . $_SERVER['HTTP_HOST'] . $clean_url);
        exit;
    }

    return false;
}

/**
 * Get the logged-in user's email from WordPress or from a platform cookie.
 */
function saas_get_user_email() {
    if (is_user_logged_in()) {
        $user = wp_get_current_user();
        return $user->user_email;
    }

    if (isset($_COOKIE['saas_user_email'])) {
        return sanitize_email($_COOKIE['saas_user_email']);
    }

    return null;
}

/**
 * Render the paywall page for non-subscribers.
 */
function saas_render_paywall($site_slug, $product_id = null) {
    $site_name = get_bloginfo('name');
    if (!empty($product_id)) {
        $marketplace_url = SAAS_PLATFORM_URL . '/marketplace/' . $product_id;
    } else {
        $marketplace_url = SAAS_PLATFORM_URL . '/marketplace';
    }
    $login_url = SAAS_PLATFORM_URL . '/login';

    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscribe to Access - <?php echo esc_html($site_name); ?></title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #e2e8f0;
            }
            .paywall-container {
                max-width: 520px;
                width: 90%;
                text-align: center;
                padding: 48px 32px;
                background: rgba(30, 41, 59, 0.8);
                border-radius: 16px;
                border: 1px solid rgba(148, 163, 184, 0.1);
                backdrop-filter: blur(10px);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            }
            .lock-icon {
                width: 64px;
                height: 64px;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 24px;
                font-size: 28px;
            }
            h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #f1f5f9; }
            .site-name { color: #818cf8; font-weight: 600; }
            p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 32px; }
            .btn {
                display: inline-block;
                padding: 12px 32px;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.2s;
            }
            .btn-primary {
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: white;
            }
            .btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
            }
            .btn-outline {
                background: transparent;
                color: #94a3b8;
                border: 1px solid rgba(148, 163, 184, 0.3);
            }
            .btn-outline:hover { background: rgba(148, 163, 184, 0.1); color: #e2e8f0; }
            .buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
            .features { margin: 24px 0 32px; text-align: left; padding: 0 16px; }
            .features li {
                list-style: none;
                padding: 8px 0;
                font-size: 14px;
                color: #cbd5e1;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .features li::before { content: "\2713"; color: #22c55e; font-weight: bold; font-size: 16px; }
            .divider { height: 1px; background: rgba(148, 163, 184, 0.1); margin: 24px 0; }
            .login-text { font-size: 13px; color: #64748b; margin-bottom: 0; }
            .login-text a { color: #818cf8; text-decoration: none; }
            .login-text a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="paywall-container">
            <div class="lock-icon">&#128274;</div>
            <h1>Premium Content</h1>
            <p>
                This content on <span class="site-name"><?php echo esc_html($site_name); ?></span>
                requires an active subscription. Subscribe through our marketplace to get full access.
            </p>

            <ul class="features">
                <li>Full access to all content and features</li>
                <li>Regular updates and new features</li>
                <li>Cancel anytime from your dashboard</li>
                <li>Secure payments via Stripe</li>
            </ul>

            <div class="buttons">
                <a href="<?php echo esc_url($marketplace_url); ?>" class="btn btn-primary">
                    Browse Marketplace
                </a>
                <a href="<?php echo esc_url($login_url); ?>" class="btn btn-outline">
                    Log In
                </a>
            </div>

            <div class="divider"></div>

            <p class="login-text">
                Already subscribed? <a href="<?php echo esc_url($login_url); ?>">Log in to your account</a>
                to access this content.
            </p>
        </div>
    </body>
    </html>
    <?php
}

/**
 * Shortcode for gating specific content within a page.
 * Usage: [saas_content plan="pro"]Premium content here[/saas_content]
 */
function saas_content_shortcode($atts, $content = null) {
    $atts = shortcode_atts(['plan' => ''], $atts, 'saas_content');
    $site_slug = saas_get_site_slug();

    if (!is_user_logged_in()) {
        return '<div style="padding:24px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;text-align:center;margin:16px 0;">
            <p style="margin:0 0 12px;color:#495057;">&#128274; Please log in to access this content.</p>
            <a href="' . esc_url(SAAS_PLATFORM_URL . '/login') . '" style="display:inline-block;padding:10px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Log In</a>
        </div>';
    }

    $user = wp_get_current_user();
    $access = saas_check_subscription($user->user_email, $site_slug);

    if (!empty($access['hasAccess'])) {
        if (!empty($atts['plan']) && strtolower($access['plan'] ?? '') !== strtolower($atts['plan'])) {
            return '<div style="padding:24px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;text-align:center;margin:16px 0;">
                <p style="margin:0 0 12px;color:#495057;">&#128274; This content requires the <strong>' . esc_html($atts['plan']) . '</strong> plan.</p>
                <a href="' . esc_url(SAAS_PLATFORM_URL . '/marketplace') . '" style="display:inline-block;padding:10px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Upgrade Plan</a>
            </div>';
        }
        return do_shortcode($content);
    }

    return '<div style="padding:24px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;text-align:center;margin:16px 0;">
        <p style="margin:0 0 12px;color:#495057;">&#128274; Subscribe to access this content.</p>
        <a href="' . esc_url(SAAS_PLATFORM_URL . '/marketplace') . '" style="display:inline-block;padding:10px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">View Plans</a>
    </div>';
}
add_shortcode('saas_content', 'saas_content_shortcode');

/**
 * Main access control hook - runs on every frontend page load.
 */
function saas_access_control() {
    // Skip for admin pages, login, REST API, cron
    if (is_admin() || wp_doing_cron() || wp_doing_ajax()) {
        return;
    }

    if (in_array($GLOBALS['pagenow'] ?? '', ['wp-login.php', 'wp-register.php'])) {
        return;
    }

    if (defined('REST_REQUEST') && REST_REQUEST) {
        return;
    }

    $site_slug = saas_get_site_slug();
    if (empty($site_slug)) {
        return;
    }

    // Handle launch token from platform (validates + sets cookie + redirects)
    saas_handle_launch_token();

    // Site admins/developers always have access
    if (is_user_logged_in() && current_user_can('manage_options')) {
        return;
    }

    $user_email = saas_get_user_email();

    $access = saas_check_subscription($user_email, $site_slug);

    if (empty($access['hasAccess'])) {
        saas_render_paywall($site_slug, $access['productId'] ?? null);
        exit;
    }

    // User has access - add plan info to header
    if (!empty($access['plan'])) {
        header('X-Subscription-Plan: ' . $access['plan']);
    }
}
add_action('template_redirect', 'saas_access_control');

/**
 * Add marketplace branding to admin bar.
 */
function saas_admin_bar_notice($wp_admin_bar) {
    if (is_admin()) {
        return;
    }

    $wp_admin_bar->add_node([
        'id'    => 'saas-marketplace',
        'title' => 'Powered by Saasifyy',
        'href'  => SAAS_PLATFORM_URL,
        'meta'  => ['target' => '_blank'],
    ]);
}
add_action('admin_bar_menu', 'saas_admin_bar_notice', 100);
