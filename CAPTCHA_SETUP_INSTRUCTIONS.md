# 🛡️ Production reCAPTCHA Setup Instructions

## Step 1: Get Your Production Keys

1. **Go to Google reCAPTCHA Admin Console:**
   - Visit: https://www.google.com/recaptcha/admin
   - Sign in with your Google account

2. **Update Your Existing Site (or Create New):**
   - Go to your existing "Arriba Homestay Production" site
   - Click on it to edit settings
   - **Label**: "Arriba Homestay Production"
   - **reCAPTCHA type**: Select "reCAPTCHA v2" → "I'm not a robot" Checkbox
   - **Domains**: Add ALL your domains:
     - `arribahomestay.site` (NEW - custom domain)
     - `www.arribahomestay.site` (NEW - custom domain with www)
     - `arribahomestay.github.io` (GitHub Pages)
     - `www.arribahomestay.github.io` (GitHub Pages with www)
     - `localhost` (for local testing)
     - `127.0.0.1` (for local testing)
   - **Accept Terms of Service**
   - Click **"Save"** (or "Submit" if creating new)

3. **Copy Your Keys:**
   - **Site Key** (starts with `6L...`) - for frontend
   - **Secret Key** (starts with `6L...`) - for backend verification

## Step 2: Update Your Code

### Replace in `index.html` (line 492):
```html
<!-- Replace YOUR_SITE_KEY with your actual production site key -->
<div class="g-recaptcha" data-sitekey="YOUR_ACTUAL_SITE_KEY" data-callback="onCaptchaSuccess" data-expired-callback="onCaptchaExpired"></div>
```

### Your `script.js` is already configured with:
```javascript
const PRODUCTION_CONFIG = {
    RECAPTCHA_SITE_KEY: '6LcNlfcrAAAAAFCZoXwniLEJ48I89OWnKo44FTgG',
    RECAPTCHA_SECRET_KEY: '6LcNIfcrAAAAAAx9KhsuSHQHtJjsXsQv2jslsfQC',
    ALLOWED_DOMAINS: [
        'arribahomestay.site',              // Custom domain
        'www.arribahomestay.site',          // Custom domain with www
        'arribahomestay.github.io',         // GitHub Pages
        'www.arribahomestay.github.io',     // GitHub Pages with www
        'localhost',                        // Local development
        '127.0.0.1'                         // Local development
    ]
};
```

## Step 3: Optional - Backend Verification

For maximum security, verify the CAPTCHA token on your server:

### Node.js Example:
```javascript
const axios = require('axios');

async function verifyCaptcha(token, secretKey) {
    try {
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', {
            secret: secretKey,
            response: token,
            remoteip: req.ip
        });
        
        return response.data.success;
    } catch (error) {
        console.error('CAPTCHA verification failed:', error);
        return false;
    }
}
```

### PHP Example:
```php
function verifyCaptcha($token, $secretKey) {
    $url = 'https://www.google.com/recaptcha/api/siteverify';
    $data = [
        'secret' => $secretKey,
        'response' => $token,
        'remoteip' => $_SERVER['REMOTE_ADDR']
    ];
    
    $options = [
        'http' => [
            'header' => "Content-type: application/x-www-form-urlencoded\r\n",
            'method' => 'POST',
            'content' => http_build_query($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    $response = json_decode($result, true);
    
    return $response['success'];
}
```

## Step 4: Test Your Implementation

1. **Deploy your updated code**
2. **Test the booking form:**
   - Fill out the form
   - Complete the CAPTCHA
   - Submit the booking
   - Verify it works correctly

## Security Benefits

✅ **Prevents spam** submissions from bots  
✅ **Domain validation** ensures CAPTCHA only works on your site  
✅ **Token verification** for server-side validation  
✅ **Production-ready** configuration  
✅ **Mobile responsive** design  

## Troubleshooting

- **CAPTCHA not showing**: Check if your domain is added to reCAPTCHA console
- **Verification fails**: Ensure site key matches your domain
- **Mobile issues**: CAPTCHA should scale automatically on mobile devices

Your CAPTCHA is now production-ready! 🚀
