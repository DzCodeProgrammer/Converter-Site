# File Converter - Professional Document Conversion System

A modern, full-stack file conversion web application built with Next.js, Express.js, and Prisma. Convert documents, images, audio, and video files with real-time progress tracking and a beautiful user interface.

## 🌟 Features

- **📄 Document Conversion**: PDF ↔ DOCX ↔ TXT
- **🖼️ Image Conversion**: JPG ↔ PNG ↔ GIF
- **🎵 Audio Conversion**: MP3 ↔ WAV
- **🎬 Video Conversion**: MP4 ↔ AVI
- **🎯 Drag & Drop Interface**: Modern, intuitive file upload
- **📊 Real-time Progress**: Live conversion progress with status updates
- **📱 Responsive Design**: Works on desktop, tablet, and mobile
- **🗃️ Conversion History**: Track all your conversions
- **⚡ Fast Processing**: Efficient background worker processing
- **🔒 Secure**: File validation and error handling
- **🌙 Dark Mode**: Beautiful UI with dark/light theme support

## 🏗️ Architecture

- **Frontend**: Next.js 14 with React 18, TailwindCSS, React Dropzone
- **Backend**: Express.js with Prisma ORM, SQLite database
- **Worker**: Background processing with LibreOffice, FFmpeg, ImageMagick
- **Storage**: Local filesystem (with S3 support)
- **Queue**: In-memory for development, BullMQ + Redis for production

## 📋 Prerequisites

Before running this project, ensure you have:

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js

### Conversion Tools
For file conversions to work, install these tools:

#### Windows
```bash
# Install via Chocolatey (recommended)
choco install ffmpeg imagemagick libreoffice

# Or install manually:
# - FFmpeg: https://ffmpeg.org/download.html
# - ImageMagick: https://imagemagick.org/script/download.php#windows
# - LibreOffice: https://www.libreoffice.org/download/
```

#### macOS
```bash
# Install via Homebrew
brew install ffmpeg imagemagick libreoffice
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg imagemagick libreoffice
```

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
# Run the setup script
scripts\setup-dev.bat

# Start development servers
scripts\start-dev.bat
```

**Linux/macOS:**
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run the setup script
./scripts/setup-dev.sh

# Start development servers
./scripts/start-dev.sh
```

### Option 2: Manual Setup

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd Converter

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install worker dependencies
cd worker
npm install
cd ..
```

2. **Set up Environment Variables**
```bash
# Copy environment file
cp .env.example .env

# Edit .env file with your configuration
```

3. **Initialize Database**
```bash
# Generate Prisma client
npx prisma generate

# Create database
npx prisma db push
```

4. **Create Upload Directory**
```bash
mkdir uploads
```

5. **Start Development Servers**

In separate terminal windows:

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

6. **Open Your Browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

The `.env` file contains all configuration options:

```bash
# Backend Configuration
PORT=4000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000

# Storage Configuration
STORAGE_MODE=local          # "local" or "s3"
STORAGE_LOCAL_PATH=uploads
MAX_FILE_SIZE_BYTES=104857600  # 100MB

# Database
DATABASE_URL=file:./dev.db

# Conversion Tools (adjust paths as needed)
FFMPEG_PATH=ffmpeg
IMAGEMAGICK_CONVERT=magick
LIBREOFFICE_PATH=soffice

# Redis (for production)
REDIS_HOST=
REDIS_PORT=6379

# JWT Security
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=7d

# S3 Configuration (if using S3)
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.amazonaws.com
```

### Supported File Types

| Category | Input Formats | Output Formats |
|----------|---------------|----------------|
| Documents | PDF, DOCX, DOC, TXT | PDF, DOCX, TXT |
| Images | JPG, PNG, GIF | JPG, PNG, GIF |
| Audio | MP3, WAV | MP3, WAV |
| Video | MP4, AVI | MP4, AVI |

**File Size Limit**: 100MB per file

## 🔄 How It Works

1. **Upload**: User drags/drops or selects a file
2. **Validation**: Frontend validates file type and size
3. **API Call**: File is uploaded to backend via REST API
4. **Database**: Conversion job is stored in SQLite database
5. **Queue**: Job is added to processing queue
6. **Worker**: Background worker processes the conversion
7. **Progress**: Real-time progress updates via polling
8. **Download**: Converted file is available for download

## 📁 Project Structure

```
Converter/
├── backend/
│   ├── src/
│   │   ├── routes/         # API routes
│   │   │   ├── auth.js     # Authentication
│   │   │   └── convert.js  # Conversion API
│   │   ├── services/       # Business logic
│   │   │   ├── queue.js    # Job queue management
│   │   │   └── storage.js  # File storage
│   │   ├── middleware/     # Express middleware
│   │   │   └── validation.js
│   │   └── server.js       # Express server
│   └── package.json
├── frontend/
│   ├── pages/              # Next.js pages
│   │   ├── _app.js         # App wrapper
│   │   └── index.js        # Main page
│   ├── components/         # React components
│   │   ├── ConversionHistory.js
│   │   └── ErrorBoundary.js
│   ├── utils/              # Utility functions
│   │   └── fileValidation.js
│   ├── styles/             # CSS styles
│   │   └── globals.css
│   └── package.json
├── worker/
│   ├── src/
│   │   ├── worker.js       # Main worker process
│   │   └── documentConverter.js
│   └── package.json
├── prisma/
│   └── schema.prisma       # Database schema
├── scripts/                # Development scripts
│   ├── setup-dev.bat      # Windows setup
│   ├── setup-dev.sh       # Linux/macOS setup
│   ├── start-dev.bat      # Windows start
│   └── start-dev.sh       # Linux/macOS start
├── .env                    # Environment variables
└── README.md
```

## 🔌 API Endpoints

### Conversion API

- `POST /api/convert/upload` - Upload file for conversion
- `GET /api/convert/status/:id` - Get conversion status
- `GET /api/convert/download/:id` - Download converted file
- `PUT /api/convert/status/:id` - Update conversion status (worker)
- `GET /api/convert/list` - List conversion history

### Health Check

- `GET /health` - Server health status

## 🧪 Testing

### Manual Testing

1. Start the development servers
2. Open http://localhost:3000
3. Try uploading different file types:
   - PDF → DOCX conversion
   - JPG → PNG conversion
   - MP3 → WAV conversion
   - TXT → PDF conversion

### API Testing

Use tools like Postman or curl:

```bash
# Health check
curl http://localhost:4000/health

# Upload file
curl -X POST -F "file=@test.pdf" -F "format=docx" \
  http://localhost:4000/api/convert/upload

# Check status
curl http://localhost:4000/api/convert/status/[job-id]
```

## 🚀 Production Deployment

### 1. Build for Production

```bash
# Build frontend
cd frontend
npm run build
cd ..

# Or use the build script
./scripts/build-prod.sh
```

### 2. Environment Setup

- Set up Redis for production queue
- Configure S3 for file storage
- Set up proper JWT secrets
- Configure HTTPS

### 3. Process Management

Use PM2 for production process management:

```bash
npm install -g pm2

# Start backend
cd backend
pm2 start src/server.js --name "converter-backend"

# Start frontend (if using PM2)
cd frontend
pm2 start npm --name "converter-frontend" -- start

# Start worker (if using separate worker)
cd worker
pm2 start src/worker.js --name "converter-worker"
```

### 4. Nginx Configuration

Example Nginx config:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }

    # File downloads
    location /files/ {
        proxy_pass http://localhost:4000;
    }
}
```

## 🛠️ Troubleshooting

### Common Issues

**1. Conversion tools not found**
```
Error: Command failed: ffmpeg
```
*Solution*: Install FFmpeg, ImageMagick, and LibreOffice. Update paths in `.env`.

**2. File upload fails**
```
Error: File too large
```
*Solution*: Check `MAX_FILE_SIZE_BYTES` in `.env` and server limits.

**3. Database connection error**
```
Error: Can't reach database server
```
*Solution*: Run `npx prisma db push` to create the database.

**4. Permission denied on Linux/macOS**
```
permission denied: ./scripts/setup-dev.sh
```
*Solution*: Run `chmod +x scripts/*.sh` to make scripts executable.

**5. Port already in use**
```
Error: listen EADDRINUSE :::4000
```
*Solution*: Change ports in `.env` or kill existing processes.

### Debug Mode

Enable debug logging:

```bash
# Add to .env
NODE_ENV=development
DEBUG=converter:*
```

### Log Files

Check logs in:
- Backend: Console output
- Frontend: Browser console
- Worker: Process logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Commit: `git commit -m 'Add feature'`
5. Push: `git push origin feature-name`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check this README and troubleshooting section
2. Search existing issues on GitHub
3. Create a new issue with:
   - Your operating system
   - Node.js version
   - Complete error message
   - Steps to reproduce

## 🎯 Roadmap

- [ ] Batch file conversion
- [ ] User authentication and file management
- [ ] Advanced conversion options
- [ ] API rate limiting
- [ ] File compression
- [ ] Cloud storage integration
- [ ] Email notifications
- [ ] Conversion templates

---

**Happy Converting! 🎉**
