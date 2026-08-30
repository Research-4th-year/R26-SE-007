const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all .tsx files
const files = execSync('find app -name "*.tsx" -type f').toString().split('\n').filter(Boolean);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('SafeAreaView')) {
    // If it imports from react-native, remove it and add it to react-native-safe-area-context
    const reactNativeImportRegex = /import\s+{([^}]*)}\s+from\s+["']react-native["'];?/g;
    
    let hasSafeAreaViewInReactNative = false;
    
    content = content.replace(reactNativeImportRegex, (match, imports) => {
      const items = imports.split(',').map(i => i.trim());
      if (items.includes('SafeAreaView')) {
        hasSafeAreaViewInReactNative = true;
        const newItems = items.filter(i => i !== 'SafeAreaView');
        if (newItems.length === 0) return '';
        return `import { ${newItems.join(', ')} } from "react-native";`;
      }
      return match;
    });

    if (hasSafeAreaViewInReactNative) {
      // Check if react-native-safe-area-context import exists
      if (content.includes('react-native-safe-area-context')) {
         // It might already have it, or we need to add SafeAreaView to it.
         // Actually, most of them probably just import it natively.
         const safeAreaContextRegex = /import\s+{([^}]*)}\s+from\s+["']react-native-safe-area-context["'];?/;
         if (safeAreaContextRegex.test(content)) {
           content = content.replace(safeAreaContextRegex, (match, imports) => {
             const items = imports.split(',').map(i => i.trim());
             if (!items.includes('SafeAreaView')) {
               items.push('SafeAreaView');
               return `import { ${items.join(', ')} } from "react-native-safe-area-context";`;
             }
             return match;
           });
         } else {
           // Insert after react-native import
           content = `import { SafeAreaView } from "react-native-safe-area-context";\n` + content;
         }
      } else {
        content = `import { SafeAreaView } from "react-native-safe-area-context";\n` + content;
      }
      
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed', file);
    }
  }
}
