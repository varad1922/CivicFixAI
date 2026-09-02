const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk(path.join(__dirname, 'client', 'src'));
files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('http://localhost:5000/api')) {
    // In AuthContext it is 'http://localhost:5000/api/auth/' -> `${import.meta.env.VITE_API_URL}/auth/`
    // Wait, let's just do it cleanly:
    
    // For string literals like 'http://localhost:5000/api/...' -> `${import.meta.env.VITE_API_URL}/...`
    content = content.replace(/'http:\/\/localhost:5000\/api\/([^']+)'/g, '`${import.meta.env.VITE_API_URL}/$1`');
    
    // For template literals like `http://localhost:5000/api/...` -> `${import.meta.env.VITE_API_URL}/...`
    content = content.replace(/`http:\/\/localhost:5000\/api\/([^`]+)`/g, '`${import.meta.env.VITE_API_URL}/$1`');
    
    // For AuthContext specifically which has `const API_URL = 'http://localhost:5000/api/auth/';`
    content = content.replace(/'http:\/\/localhost:5000\/api'/g, 'import.meta.env.VITE_API_URL');
    
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
