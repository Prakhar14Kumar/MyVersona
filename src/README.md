# VerSona 🌟

**Where College Life Meets Career Growth**

VerSona is a youth-focused, Indian-first social and professional networking platform designed to connect college students, foster communities, and accelerate career development.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Check environment setup
npm run check-env

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app!

📖 **First time?** Read the [Quick Start Guide](QUICK_START.md)

---

## ⚡ Features

### Social Networking
- 🎯 Dual-feed system (Entertainment + Career)
- 📱 Stories with 24-hour expiry
- 💬 Real-time chat with typing indicators
- 🔍 Advanced search (users, posts, colleges)
- 🎓 College-based communities
- 🔖 Bookmarks and saved content

### Professional Growth
- 💼 Job board with AI matching
- 📄 Resume builder & ATS scoring
- 🎨 AI-powered content tools
- 📊 Growth dashboard with analytics
- 🏆 Events & hackathons
- 🤝 Networking opportunities

### Smart Features
- 🤖 AI Career Assistant
- 🎯 Personalized recommendations
- 📈 User behavior tracking
- 🔔 Real-time notifications
- 📱 Responsive design
- 🌐 Offline support

---

## 📋 Documentation

| Document | Purpose |
|----------|---------|
| [QUICK_START.md](QUICK_START.md) | Get running in 5 minutes |
| [SETUP.md](SETUP.md) | Complete setup guide |
| [FIREBASE_SETUP_INSTRUCTIONS.md](FIREBASE_SETUP_INSTRUCTIONS.md) | Firebase configuration |
| [PRODUCTION_READINESS_AUDIT.md](PRODUCTION_READINESS_AUDIT.md) | QA report & issues |
| [ENVIRONMENT_FIX_SUMMARY.md](ENVIRONMENT_FIX_SUMMARY.md) | Environment setup details |

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **UI Components:** Radix UI
- **Icons:** Lucide React
- **Charts:** Recharts
- **Animations:** Motion (Framer Motion)

### Backend
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Storage:** Firebase Storage
- **Analytics:** Firebase Analytics
- **API:** Python FastAPI (optional)

### Development
- **Language:** TypeScript
- **Linting:** ESLint
- **Package Manager:** npm

---

## 📦 Project Structure

```
versona/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── figma/          # Figma imports
│   ├── FeedPage.tsx    # Main feed
│   ├── ChatPage.tsx    # Messaging
│   ├── ProfilePage.tsx # User profiles
│   └── ...
├── lib/                # Core libraries
│   ├── firebase.ts     # Firebase config
│   ├── firebaseAuth.ts # Auth functions
│   ├── chatService.ts  # Chat logic
│   └── ...
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
├── utils/              # Utility functions
├── styles/             # Global styles
├── firebase/           # Firebase rules & indexes
├── python-backend/     # FastAPI backend (optional)
└── public/             # Static assets
```

---

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Environment
npm run check-env        # Validate environment config
```

---

## 🔐 Environment Setup

### Required Variables

Create a `.env` file with:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
```

📖 See [FIREBASE_SETUP_INSTRUCTIONS.md](FIREBASE_SETUP_INSTRUCTIONS.md) for details

---

## 🚦 Current Status

**Version:** 2.0.0  
**Status:** Beta Launch Ready  
**Production Readiness:** 9.0/10

### ✅ What's Working
- Complete authentication system
- Real-time messaging
- Feed with infinite scroll
- Search functionality
- Profile management
- File uploads
- Firestore security rules
- Error handling & logging
- Analytics integration

### 🔧 What's Needed
- Real Firebase credentials (demo values provided)
- Backend deployment (optional)
- Production environment variables

---

## 🔒 Security

- ✅ No hardcoded credentials
- ✅ Environment-based configuration
- ✅ Firestore security rules deployed
- ✅ Input validation & sanitization
- ✅ XSS protection
- ✅ Rate limiting
- ✅ Protected routes
- ✅ Secure file uploads

---

## 🤝 Contributing

This is a private project. If you have access:

1. Follow the setup guide
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📝 License

**Private & Proprietary**

This project is private and proprietary. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 🆘 Support

### Having Issues?

1. **Environment errors?** → Run `npm run check-env`
2. **Firebase errors?** → Check [FIREBASE_SETUP_INSTRUCTIONS.md](FIREBASE_SETUP_INSTRUCTIONS.md)
3. **Build failing?** → Check [SETUP.md](SETUP.md) troubleshooting section
4. **Other issues?** → Check [PRODUCTION_READINESS_AUDIT.md](PRODUCTION_READINESS_AUDIT.md)

### Resources

- [React Docs](https://react.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## 🎯 Roadmap

### Phase 1: Beta Launch (Current)
- [x] Core features complete
- [x] Security implementation
- [x] Environment setup
- [ ] Production deployment
- [ ] User testing

### Phase 2: Growth
- [ ] Mobile apps (React Native)
- [ ] Advanced AI features
- [ ] Video calls
- [ ] Premium features
- [ ] Monetization

### Phase 3: Scale
- [ ] Multi-language support
- [ ] International expansion
- [ ] Enterprise features
- [ ] API for third parties

---

## 🌟 Key Differentiators

1. **India-First Design** - Built for Indian college students
2. **Dual-Feed System** - Entertainment + Career in one place
3. **AI-Powered Tools** - Smart resume builder, content assistant
4. **Real Community** - College-based networking
5. **Career Focus** - Job board, skills, opportunities
6. **Modern Tech Stack** - Fast, reliable, scalable

---

## 📊 Stats

- **Total Issues Fixed:** 38
- **Production Readiness:** 9.0/10
- **Code Quality:** TypeScript strict mode
- **Test Coverage:** Core features tested
- **Performance:** Optimized with lazy loading
- **Security:** Multiple layers of protection

---

## 👥 Team

**VerSona Team**  
Building the future of college networking in India 🇮🇳

---

## 🎉 Acknowledgments

- Firebase for backend infrastructure
- React team for amazing framework
- Tailwind CSS for beautiful styling
- Radix UI for accessible components
- Open source community

---

**Built with ❤️ for Indian Students**

*Version 2.0.0 - April 2, 2026*
