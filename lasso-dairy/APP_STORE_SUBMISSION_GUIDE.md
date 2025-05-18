# Lasso Dairy App Store Submission Guide

This guide provides step-by-step instructions for building and submitting the Lasso Dairy mobile app to both the Apple App Store and Google Play Store.

## Prerequisites

### Apple App Store

- An active [Apple Developer Program](https://developer.apple.com/programs/) account ($99/year)
- Xcode installed on a Mac computer
- App Store Connect account set up
- App record created in App Store Connect
- Certificates and provisioning profiles configured

### Google Play Store

- A [Google Play Developer account](https://play.google.com/console/signup) ($25 one-time fee)
- App listing created in Google Play Console
- Signing key generated and stored securely
- Service account configured for automated submissions

## Update Configuration Files

### 1. Update app.config.js

Ensure the Expo configuration has the correct:

- App name, slug, and version
- Bundle/package identifiers
- Icons and splash screens

### 2. Configure eas.json

Update the placeholder values in `eas.json` with your actual credentials:

```json
"ios": {
  "appleId": "your-apple-id@example.com",
  "ascAppId": "1234567890",
  "appleTeamId": "AB12CD34EF"
},
"android": {
  "serviceAccountKeyPath": "./path-to-your-key.json",
  "track": "production"
}
```

- **appleId**: Your Apple Developer account email
- **ascAppId**: Your App Store Connect App ID
- **appleTeamId**: Your Apple Developer Team ID
- **serviceAccountKeyPath**: Path to your Google Play service account key JSON file

## Building for Production

### Prerequisites for Building

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Log in to your Expo account
eas login
```

### Build for iOS and Android

```bash
# Set environment to production
export APP_ENV=production

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Or build for both platforms at once
eas build --platform all --profile production
```

During the build process:

- For iOS, EAS Build will generate an IPA file
- For Android, EAS Build will generate an AAB (Android App Bundle) file

## Submitting to App Stores

### Submit to Apple App Store

#### Option 1: Manual Submission (Apple)

1. Download the IPA file from EAS Build
2. Open Xcode and go to Organizer (Window > Organizer)
3. Drag and drop the IPA file into Organizer
4. Click "Distribute App" and follow the prompts

#### Option 2: Automated Submission (iOS)

```bash
eas submit --platform ios
```

### Submit to Google Play Store

#### Option 1: Manual Submission

1. Download the AAB file from EAS Build
2. Go to Google Play Console > Your App > Production > Create new release
3. Upload the AAB file and follow the prompts

#### Option 2: Automated Submission

```bash
eas submit --platform android
```

## App Store Optimization (ASO)

### App Store Metadata

- **App Name**: "Lasso Dairy" (consistent across platforms)
- **Subtitle** (App Store): "Fresh Dairy Delivery"
- **Short Description** (Play Store): "Order fresh, locally sourced dairy products delivered to your door."
- **Keywords**: dairy, milk, delivery, local, fresh, organic
- **Category**: Food & Drink
- **Screenshots**: Include 5-10 screenshots for each device type

### App Description

The app description should highlight key features:

- Fresh dairy delivery to your doorstep
- Locally sourced products
- Recurring delivery options
- Transparent pricing
- User-friendly interface
- Secure checkout

### Visual Assets

- App Store screenshots (6.5", 5.5", and 12.9" sizes)
- Play Store screenshots (phone, 7" tablet, and 10" tablet sizes)
- App Store promotional text
- Play Store feature graphic
- App preview videos (optional but recommended)

## Post-Launch Considerations

### Monitoring

- Set up Sentry alerts for production errors
- Configure App Store Connect and Play Console notifications
- Monitor user reviews and ratings

### Updates

- Plan for regular updates (every 4-6 weeks)
- Use phased rollouts for major changes
- Test extensively before submitting updates

### User Feedback

- Implement in-app feedback mechanism
- Respond to App Store and Play Store reviews
- Use crash reports to prioritize fixes

## Compliance

### Privacy

- Ensure Privacy Policy is up to date
- Update App Store privacy labels
- Complete Google Play Data Safety form

### Terms of Service

- Include Terms of Service in the app
- Ensure compliance with platform-specific requirements

### Data Handling

- Comply with GDPR, CCPA, and other relevant regulations
- Document data handling procedures

## Troubleshooting Common Issues

### iOS Submission Rejections

- Missing privacy policy
- Incomplete metadata
- Crashes during review
- Insufficient app functionality

### Android Submission Issues

- Missing content rating questionnaire
- Target API level not meeting requirements
- App Bundle validation errors

## Resources

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Store Launch Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)
- [Expo EAS Documentation](https://docs.expo.dev/eas/)
