# iOS Build and Submission Guide for Lasso Dairy App

## Configuration Steps Completed

We've successfully configured the following:

1. **Fixed Project Ownership**: 
   - Updated the `app.config.js` file to correctly specify the project owner as "vie-inc"
   - Verified project configuration with `eas project:info` command
   - Project is now correctly identified as `@vie-incorporated/lasso-dairy`

2. **Updated iOS Submission Configuration**:
   - Modified `eas.json` with iOS submission parameters
   - Apple Developer values detected from your account:
     - Apple Team ID: RCPV4JYL9A (Vie Incorporated)
     - Developer ID: 4WTZZ8K4B4
     - Distribution Certificate Serial: 66CAB8A955F623C0258924OCBC7283D
     - EAS Submit Key ID: 4H2DZ2FCZ9
     - EAS Submit Key Issuer ID: 3049913b-e2bb-49d6-ac32-5d15b59e1fff

## Next Steps for iOS Build and Submission

### 1. Update Credentials
I've already updated the Apple Team ID in `eas.json` to match your Vie Incorporated account (RCPV4JYL9A). 
Before proceeding, you still need to update:
   - `appleId`: Replace `<YOUR_APPLE_ID_EMAIL>` with the email address used for your Apple Developer account
   - `ascAppId`: Replace `<YOUR_APP_STORE_CONNECT_APP_ID>` with your App Store Connect App ID 
     (this is a numeric ID found in App Store Connect for your specific app)

### 2. Build the iOS App
Run the build command in your project root:
```bash
cd lasso-dairy/mobile-app
eas build --platform ios
```

During the build process, you may be prompted to:
- Log in to your Apple Developer account
- Create or select provisioning profiles
- Select build profiles (use "production" for App Store submissions)
- Confirm build settings

### 3. Monitor the Build Progress
- The build will be queued on Expo's build servers
- You can check build status using: `eas build:list`
- You can view detailed logs with: `eas build:view`

### 4. Submit to App Store
Once the build is complete, you can submit directly to the App Store:
```bash
eas submit -p ios --latest
```

#### Using API Key for Submission
You already have an API key configured for EAS Submit with ID `4H2DZ2FCZ9` and Issuer ID `3049913b-e2bb-49d6-ac32-5d15b59e1fff`. This key can be used for non-interactive submissions:

```bash
# For non-interactive submission using API key
eas submit -p ios --latest --api-key-path=/path/to/api-key.p8 --api-key-id=4H2DZ2FCZ9 --api-key-issuer-id=3049913b-e2bb-49d6-ac32-5d15b59e1fff
```

If you don't have the .p8 key file locally, you can download it from your Apple Developer account.

### 5. Alternative: Manual Submission
If you prefer manual submission:
1. Download the completed build from the Expo dashboard
2. Use Apple Transporter or App Store Connect to upload the build
3. Complete the App Store Connect submission process

## Troubleshooting

- **Authentication Issues**: Ensure your Apple Developer account has the correct permissions
- **Build Failures**: Check the build logs for specific errors using `eas build:view`
- **Rejected Builds**: Review App Store guidelines and update the app accordingly

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [iOS Submission Guide](https://docs.expo.dev/submit/ios/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## Contact Support

If you encounter any issues with the build or submission process, contact:
- Expo Support: https://expo.dev/support
- Apple Developer Support: https://developer.apple.com/support/
