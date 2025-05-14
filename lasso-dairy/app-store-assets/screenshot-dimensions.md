# App Store Screenshot Dimensions Reference

## Apple App Store Requirements

### iPhone Screenshots

| Device | Portrait (WxH) | Landscape (WxH) |
|--------|---------------|-----------------|
| **iPhone 6.5"** (12 Pro Max, 11 Pro Max) | 1242 x 2688 | 2688 x 1242 |
| **iPhone 5.5"** (8 Plus, 7 Plus, 6s Plus) | 1242 x 2208 | 2208 x 1242 |

### iPad Screenshots

| Device | Portrait (WxH) | Landscape (WxH) |
|--------|---------------|-----------------|
| **iPad Pro 12.9"** (3rd gen and later) | 2048 x 2732 | 2732 x 2048 |
| **iPad Pro 11"** | 1668 x 2388 | 2388 x 1668 |

### Apple Watch Screenshots

| Device | Size (WxH) |
|--------|------------|
| **Apple Watch Series 7 & later (45mm)** | 396 x 484 |
| **Apple Watch Series 4 & later (44mm)** | 368 x 448 |
| **Apple Watch Series 7 & later (41mm)** | 352 x 430 |
| **Apple Watch Series 3 & later (40mm)** | 324 x 394 |

## Google Play Store Requirements

### Phone Screenshots

| Type | Size (WxH) | Minimum Required |
|------|------------|------------------|
| **Phone Portrait** | 1080 x 1920 | 2 screenshots |
| **Phone Landscape** | 1920 x 1080 | Optional |

### Tablet Screenshots

| Type | Size (WxH) | Minimum Required |
|------|------------|------------------|
| **7" Tablet Portrait** | 1080 x 1920 | 1 screenshot (if app supports tablets) |
| **7" Tablet Landscape** | 1920 x 1080 | Optional |
| **10" Tablet Portrait** | 1920 x 2560 | 1 screenshot (if app supports tablets) |
| **10" Tablet Landscape** | 2560 x 1920 | Optional |

## Technical Requirements

### File Format

- **Format**: PNG or JPEG
- **Color space**: RGB (sRGB or P3)
- **Depth**: 8-bit per channel
- **Max file size**: 2MB per image for App Store, 8MB per image for Google Play

### Design Considerations

- Screenshots should have the same pixel dimensions across a device type
- Avoid using drop shadows on device frames if using simulator captures
- Ensure proper spacing for the "safe area" - content shouldn't be too close to edges
- Use high-quality images without visible compression artifacts
- Maintain consistent orientation within each device type (all portrait or all landscape)

## Screenshot Specifications for Lasso Dairy

For our app, we'll create the following screenshot sets:

### iOS Screenshots

- **iPhone 6.5"**: 5 portrait screenshots (1242 x 2688px)
- **iPhone 5.5"**: 5 portrait screenshots (1242 x 2208px)
- **iPad Pro 12.9"**: 5 portrait screenshots (2048 x 2732px)

### Android Screenshots

- **Phone**: 5 portrait screenshots (1080 x 1920px)
- **7" Tablet**: 3 portrait screenshots (1080 x 1920px)
- **10" Tablet**: 3 portrait screenshots (1920 x 2560px)

## Screenshot File Naming Convention

Use the following naming convention for organizing screenshots:

```plaintext
[platform]_[device]_[orientation]_[screen-number]_[language].[extension]
```

Examples:

- `ios_iphone65_portrait_01_en-US.png`
- `android_phone_portrait_01_en-US.png`
- `ios_ipadpro_landscape_01_fr-CA.png`

## Screenshot Delivery Format

For the design team, please provide:

1. Raw screenshots from the app (without frames or text)
2. PSD/AI/Figma files with:
   - Each screenshot on a separate artboard/layer
   - Device frames as separate elements
   - Text overlays as editable text
   - All assets at 2x resolution minimum

## Screenshot Creation Process

1. Capture raw screenshots from development builds using appropriate devices or simulators
2. Apply consistent device frames (if using frames)
3. Add text overlays and any graphical elements
4. Translate captions for localized versions
5. Export in appropriate dimensions for each store
6. Verify file sizes are within limits
7. Upload to respective developer portals
