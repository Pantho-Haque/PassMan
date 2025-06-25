# Secure Password Manager Chrome Extension

A modern, secure password manager extension for Chrome that helps you store and manage website credentials with enhanced security features.

## Features

- **Secure Password Storage**: Store and manage your website credentials safely with strong encryption
- **User-Friendly Interface**: Modern, intuitive UI with dark mode support
- **Password Generation**: Create strong, random passwords with customizable options
- **Search Functionality**: Quickly find your saved credentials
- **Password Strength Analysis**: Visual feedback on password strength
- **Auto-Lock**: Automatically locks your passwords after a period of inactivity
- **Master Password Protection**: Secure all your passwords with a single master password
- **Import/Export**: Easily backup or transfer your password data
- **GitHub Integration**: Sync with GitHub and trigger GitHub Actions for automated builds and releases
- **Categories**: Organize passwords by categories (social, finance, work, etc.)
- **Dark Mode**: Toggle between light and dark themes

## Installation

### From GitHub Releases

1. Go to the [Releases](https://github.com/yourusername/password-manager-extension/releases) page
2. Download the latest release zip file
3. Extract the zip file to a location on your computer
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode" by toggling the switch in the upper right corner
6. Click "Load unpacked" and select the extracted folder
7. The extension should now be installed and visible in your Chrome toolbar

### Manual Build

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the upper right corner
4. Click "Load unpacked" and select the repository folder
5. The extension should now be installed and visible in your Chrome toolbar

## Usage

### First Time Setup

1. Click the extension icon in your Chrome toolbar
2. Set up a master password when prompted
3. Your master password will be used to encrypt and protect all your stored passwords

### Adding a New Password

1. Click the extension icon in your Chrome toolbar
2. Navigate to the "Add New" tab
3. Enter the website URL, username/email, and password
4. Optionally, select a category and add notes
5. Click "Save Password"

### Viewing and Using Saved Passwords

1. Click the extension icon in your Chrome toolbar
2. Browse or search for the website you need credentials for
3. Click on the entry to view details
4. Use the copy button to copy username or password to clipboard
5. Click the eye icon to reveal the password

### GitHub Actions Integration

The extension includes functionality to trigger GitHub Actions workflows:

1. Go to the "Settings" tab
2. Under "Data Management", click "Sync with GitHub"
3. Enter your GitHub personal access token and repository details
4. Click "Trigger Build Action" to start a GitHub Actions workflow that builds and releases the extension

## Development

### Project Structure

- `manifest.json`: Chrome extension configuration
- `popup.html`: Main extension UI
- `styles.css`: Styling for the extension
- `popup.js`: User interface logic
- `crypto.js`: Encryption and security functions
- `background.js`: Background service worker
- `.github/workflows/`: GitHub Actions workflow configurations

### Building and Testing

To build the extension for testing:

```bash
# Install web-ext tool if needed
npm install --global web-ext

# Build the extension
web-ext build --source-dir=./ --artifacts-dir=./dist
```

## Security

This extension uses the Web Cryptography API to securely store your passwords:

- All passwords are encrypted using AES-GCM
- A strong key derivation function (PBKDF2) with 100,000 iterations is used
- All sensitive operations are performed locally in your browser
- No password data is sent to external servers unless you explicitly use the GitHub sync feature

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons by [Font Awesome](https://fontawesome.com/)
- Built with [Chrome Extensions API](https://developer.chrome.com/docs/extensions/)
- Utilizes [Web Cryptography API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
