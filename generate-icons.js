const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Create the icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'client', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Sizes for standard PWA icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Additional sizes for Apple devices
const appleSizes = [
  { size: 180, name: 'apple-touch-icon' },
  { size: 167, name: 'icon-167x167' }
];

// Generate favicon.ico (multi-size ico file for browsers)
console.log('Generating favicon.ico...');
exec(`convert -background none -density 256x256 client/public/icons/favicon.svg -define icon:auto-resize=64,48,32,16 client/public/icons/favicon.ico`, (error) => {
  if (error) {
    console.error('Error generating favicon.ico:', error);
  } else {
    console.log('favicon.ico generated successfully');
  }
});

// Generate standard icon sizes
sizes.forEach(size => {
  console.log(`Generating ${size}x${size} icon...`);
  exec(`convert -background none -density 1200 client/public/icons/favicon.svg -resize ${size}x${size} client/public/icons/icon-${size}x${size}.png`, (error) => {
    if (error) {
      console.error(`Error generating ${size}x${size} icon:`, error);
    } else {
      console.log(`icon-${size}x${size}.png generated successfully`);
    }
  });
});

// Generate Apple-specific icons
appleSizes.forEach(({ size, name }) => {
  console.log(`Generating ${name}.png (${size}x${size})...`);
  exec(`convert -background none -density 1200 client/public/icons/favicon.svg -resize ${size}x${size} client/public/icons/${name}.png`, (error) => {
    if (error) {
      console.error(`Error generating ${name}.png:`, error);
    } else {
      console.log(`${name}.png generated successfully`);
    }
  });
});

// Apple splash screen sizes
const splashScreens = [
  { width: 2048, height: 2732 }, // 12.9" iPad Pro
  { width: 1668, height: 2388 }, // 11" iPad Pro
  { width: 1536, height: 2048 }, // 9.7" iPad
  { width: 1125, height: 2436 }, // iPhone X/XS
  { width: 1242, height: 2688 }, // iPhone XS Max
  { width: 828, height: 1792 },  // iPhone XR
  { width: 1242, height: 2208 }, // iPhone 8 Plus
  { width: 750, height: 1334 },  // iPhone 8/7/6s/6
  { width: 640, height: 1136 },  // iPhone SE
];

// Generate splash screens
splashScreens.forEach(({ width, height }) => {
  console.log(`Generating ${width}x${height} splash screen...`);
  
  // Create a blank canvas with the background color
  exec(`convert -size ${width}x${height} canvas:#4f46e5 client/public/icons/apple-splash-${width}-${height}.png`, (error) => {
    if (error) {
      console.error(`Error generating splash screen:`, error);
      return;
    }
    
    // Overlay the logo in the center at about 30% of the smallest dimension
    const logoSize = Math.floor(Math.min(width, height) * 0.3);
    exec(`convert client/public/icons/favicon.svg -background none -resize ${logoSize}x${logoSize} client/public/icons/temp-logo.png`, (error) => {
      if (error) {
        console.error(`Error resizing logo:`, error);
        return;
      }
      
      exec(`convert client/public/icons/apple-splash-${width}-${height}.png client/public/icons/temp-logo.png -gravity center -composite client/public/icons/apple-splash-${width}-${height}.png`, (error) => {
        if (error) {
          console.error(`Error adding logo to splash screen:`, error);
        } else {
          console.log(`apple-splash-${width}-${height}.png generated successfully`);
        }
        
        // Clean up temp file
        fs.unlinkSync('client/public/icons/temp-logo.png');
      });
    });
  });
});

console.log('Icon generation process started. This may take a few moments...');