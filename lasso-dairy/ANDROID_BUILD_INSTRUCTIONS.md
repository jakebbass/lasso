# Android Build and Submission Guide for Lasso Dairy App

## Configuration Steps Completed

We've successfully configured the following:

1. **Fixed Project Ownership**: 
   - Updated the `app.config.js` file to correctly specify the project owner as "vie-inc"
   - Verified project configuration with `eas project:info` command
   - Project is now correctly identified as `@vie-incorporated/lasso-dairy`

2. **Updated Android Submission Configuration**:
   - Modified `eas.json` with Android submission parameters
   - Updated service account key path to `./play-store-credentials.json`
   - Set submission track to "production"

## Next Steps for Android Build and Submission

### 1. Create a Google Play Service Account Key

Before you can submit to the Play Store, you need to create a service account key:

1. Go to the [Google Play Console](https://play.google.com/console/)
2. Navigate to Setup → API access
3. Create a new service account or use an existing one
4. Grant the following permissions:
   - Release manager
   - App update
   - Create releases
5. Create and download a JSON key file
6. Save this file as `play-store-credentials.json` in the `mobile-app` directory

### 2. Build the Android App

Run the build command in your project root:
```bash
cd lasso-dairy/mobile-app
eas build --platform android
```

During the build process, you may be prompted to:
- Log in to your EAS account
- Select build profiles (use "production" for Play Store submissions)
- Confirm build settings

### 3. Monitor the Build Progress

- The build will be queued on Expo's build servers
- You can check build status using: `eas build:list`
- You can view detailed logs with: `eas build:view`

### 4. Submit to Play Store

Once the build is complete, you can submit directly to the Play Store:
```bash
eas submit -p android --latest
```

This will:
- Use the service account key file to authenticate with Google Play
- Upload the build to the production track
- Make it available for review by Google Play

### 5. Alternative: Manual Submission

If you prefer manual submission:
1. Download the completed build (APK or AAB) from the Expo dashboard
2. Log in to the [Google Play Console](https://play.google.com/console/)
3. Navigate to your app → Production → Create new release
4. Upload the build, provide release notes, and submit for review

## Play Store Requirements

Ensure you have the following ready for Play Store submission:

1. **Privacy Policy URL**: Required for all apps
2. **App Screenshots**: For different device types (phone, tablet)
3. **App Icon**: High-resolution icon (512x512)
4. **Content Rating**: Complete the content rating questionnaire
5. **App Pricing**: Determine if free or paid
6. **Release Notes**: Description of what's new in this release

## Troubleshooting

- **Build Failures**: Check the build logs for specific errors using `eas build:view`
- **Submission Errors**: Verify the service account has proper permissions
- **Rejected Submissions**: Review Play Store guidelines and update the app accordingly

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android Submission Guide](https://docs.expo.dev/submit/android/)
- [Play Store Guidelines](https://play.google.com/about/developer-content-policy/)

## Contact Support

If you encounter any issues with the build or submission process, contact:
- Expo Support: https://expo.dev/support
- Google Play Support: https://support.google.com/googleplay/android-developer/
