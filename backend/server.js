const { spawn } = require('child_process');
const python = process.platform === 'win32' ? 'python' : 'python3';
const child = spawn(python, ['-m', 'waitress', '--host=0.0.0.0', '--port=5000', 'app:app'], { stdio: 'inherit', shell: true });
child.on('exit', code => process.exit(code || 0));
