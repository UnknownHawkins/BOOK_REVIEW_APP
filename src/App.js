import React, { Component } from 'react';
import './App.css';

class BookHubApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      users: JSON.parse(localStorage.getItem('bookhub_users')) || [],
      admins: JSON.parse(localStorage.getItem('bookhub_admins')) || [],
      currentUser: JSON.parse(localStorage.getItem('bookhub_current_user')) || null,
      userLibrary: JSON.parse(localStorage.getItem('user_library')) || [],
      userReviews: JSON.parse(localStorage.getItem('user_reviews')) || [],
      showLoginModal: false,
      showBookModal: false,
      activeBook: null,
      activeTab: 'user',
      activeForm: 'user-login',
      searchTerm: '',
      activeGenre: 'all',
      isMobileMenuOpen: false,
      searchResults: [],
      showSearchResults: false,
      showReviewModal: false,
      reviewData: {
        rating: 0,
        title: '',
        content: '',
        memeReview: ''
      },
      registerData: {
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      loginData: {
        username: '',
        password: ''
      },
      adminData: {
        username: '',
        password: '',
        securityCode: ''
      },
      failedAttempts: JSON.parse(localStorage.getItem('failed_attempts')) || {},
      isLocked: false,
      lockUntil: JSON.parse(localStorage.getItem('lock_until')) || 0,
      // NEW: Library filter and sort states
      libraryFilter: 'all',
      librarySort: 'title',
      // NEW: Update progress modal state
      showProgressModal: false,
      progressData: {
        currentPage: 0,
        status: 'to-read'
      }
    };

    this.encryptionKey = this.generateEncryptionKey();
    this.sessionTimeout = 30 * 60 * 1000;
    
    this.API_CONFIG = {
      GOOGLE_BOOKS: {
        BASE_URL: 'https://www.googleapis.com/books/v1/volumes',
        API_KEY: 'AIzaSyCpqKevtXzm-SuF62BqwQztTvFRB2g3Cd4'
      }
    };
    this.sampleBooks = [
      {
        id: '1',
        title: 'The Ramayana',
        author: 'Valmiki',
        cover: 'https://i.pinimg.com/736x/66/dd/c4/66ddc40d895208649668f74df692de0e.jpg',
        pdfUrl: 'https://ebooks.tirumala.org/downloads/valmiki_ramayanam.pdf',
        hindiPdfUrl: 'https://embassyofindiabangkok.gov.in/public/assets/pdf/Valmiki%20Ramayana%20aur%20Ramakien%20Ek%20Tulnamatmak%20Adhyayan.pdf',
        pages: 500,
        genre: 'indian',
        description: 'The Ramayana is an ancient Indian epic which narrates the struggle of the divine prince Rama to rescue his wife Sita from the demon king Ravana.',
        contentPreview: 'In the beginning, there was the kingdom of Ayodhya, ruled by the wise King Dasharatha...',
        rating: 4.8,
        reviews: 245,
        trending: true,
        publishedYear: '500 BCE',
        language: 'Sanskrit'
      },
      {
        id: '2',
        title: 'The Mahabharata',
        author: 'Vyasa',
        cover: 'https://i.pinimg.com/1200x/a1/77/3d/a1773d6d0798ec7a2f938e3cf19885ea.jpg',
        pdfUrl: 'https://ebooks.tirumala.org/downloads/the_mahabharata.pdf',
        hindiPdfUrl: 'https://ncert.nic.in/textbook/pdf/ghmb101.pdf',
        pages: 1200,
        genre: 'indian',
        description: 'The Mahabharata is one of the two major Sanskrit epics of ancient India, detailing the legendary Kurukshetra War fought between the Pandavas and the Kauravas.',
        contentPreview: 'The epic begins with King Shantanu of Hastinapura, who falls in love with the river goddess Ganga...',
        rating: 4.8,
        reviews: 76,
        trending: true,
        publishedYear: '400 BCE',
        language: 'Sanskrit, Hindi'
      },
      {
        id: '3',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        cover: 'https://i.pinimg.com/736x/6f/2d/5c/6f2d5c0ffb39d41a54cf4cb0e8517778.jpg',
        pdfUrl: 'https://www.raio.org/TKMFullText.pdf',
        pages: 281,
        genre: 'fiction',
        description: 'A gripping, heart-wrenching tale of race and identity in the American South during the 1930s.',
        contentPreview: 'When he was nearly thirteen, my brother Jem got his arm badly broken at the elbow...',
        rating: 4.7,
        reviews: 189,
        trending: false,
        publishedYear: '1960',
        language: 'English'
      }
    ];
    this.sampleReviews = [
      {
        id: '1',
        bookId: '1',
        userId: 'user123',
        userName: 'BookwormRavi',
        userAvatar: 'https://ui-avatars.com/api/?name=Ravi&background=2563eb&color=fff',
        rating: 5,
        title: 'Timeless Epic! 🙏',
        content: 'The Ramayana is not just a story, it\'s a way of life. The characters, the values, the teachings - everything about this epic is profound.',
        date: '2024-01-15',
        likes: 45,
        memeReview: 'When you realize Ramayana has more plot twists than your favorite Netflix show 😂'
      }
    ];
  }
  componentDidMount() {
    this.initializeDefaultAdmin();
    this.initializeTheme();
    this.initializeParticles();
    this.loadSampleData();
    this.setupEventListeners();
    this.checkAccountLock();
    this.setupSessionTimer();
  }

  componentWillUnmount() {
    this.clearSessionTimer();
  }

  // Security Methods
  generateEncryptionKey = () => {
    const existingKey = localStorage.getItem('encryption_key');
    if (existingKey) return existingKey;
    
    const newKey = 'bookhub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('encryption_key', newKey);
    return newKey;
  }

  hashPassword = (password) => {
    const salt = 'bookhub_salt_2024_secure';
    const stringToHash = password + salt + this.encryptionKey;
    return btoa(stringToHash.split('').reverse().join(''));
  }

  verifyPassword = (password, hashedPassword) => {
    return this.hashPassword(password) === hashedPassword;
  }

  // Account Lock Security
  checkAccountLock = () => {
    const { lockUntil } = this.state;
    const now = Date.now();
    
    if (lockUntil > now) {
      this.setState({ isLocked: true });
      setTimeout(() => {
        this.setState({ isLocked: false, lockUntil: 0 });
        localStorage.removeItem('lock_until');
      }, lockUntil - now);
    }
  }

  recordFailedAttempt = (identifier) => {
    const { failedAttempts } = this.state;
    const attempts = (failedAttempts[identifier] || 0) + 1;
    const newFailedAttempts = { ...failedAttempts, [identifier]: attempts };
    
    this.setState({ failedAttempts: newFailedAttempts });
    localStorage.setItem('failed_attempts', JSON.stringify(newFailedAttempts));

    if (attempts >= 5) {
      const lockUntil = Date.now() + (15 * 60 * 1000);
      this.setState({ isLocked: true, lockUntil });
      localStorage.setItem('lock_until', JSON.stringify(lockUntil));
      
      setTimeout(() => {
        this.setState({ 
          isLocked: false, 
          lockUntil: 0,
          failedAttempts: { ...newFailedAttempts, [identifier]: 0 }
        });
        localStorage.removeItem('lock_until');
        localStorage.setItem('failed_attempts', JSON.stringify({ ...newFailedAttempts, [identifier]: 0 }));
      }, 15 * 60 * 1000);
      
      return true;
    }
    return false;
  }

  resetFailedAttempts = (identifier) => {
    const { failedAttempts } = this.state;
    const newFailedAttempts = { ...failedAttempts, [identifier]: 0 };
    this.setState({ failedAttempts: newFailedAttempts });
    localStorage.setItem('failed_attempts', JSON.stringify(newFailedAttempts));
  }

  // Session Management
  setupSessionTimer = () => {
    this.sessionTimer = setTimeout(() => {
      if (this.state.currentUser) {
        this.handleLogout();
        this.showToast('Session expired. Please login again.', 'warning');
      }
    }, this.sessionTimeout);
  }
  clearSessionTimer = () => {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
  }

  resetSessionTimer = () => {
    this.clearSessionTimer();
    this.setupSessionTimer();
  }

  // Input Sanitization
  sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  validateEmail = (email) => {
    const { users } = this.state;
    const sanitizedEmail = this.sanitizeInput(email);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return { valid: false, message: 'Please enter a valid email' };
    }
    
    const disposableDomains = ['tempmail.com', 'throwaway.com', 'guerrillamail.com'];
    const domain = sanitizedEmail.split('@')[1];
    if (disposableDomains.includes(domain)) {
      return { valid: false, message: 'Disposable email addresses are not allowed' };
    }
    
    if (users.find(u => u.email === sanitizedEmail)) {
      return { valid: false, message: 'Email already registered' };
    }
    
    return { valid: true, message: 'Email looks perfect! ✨' };
  }

  validateUsername = (username) => {
    const { users } = this.state;
    const sanitizedUsername = this.sanitizeInput(username);
    
    if (sanitizedUsername.length < 3) {
      return { valid: false, message: 'Username too short (min 3 chars)' };
    }
    if (sanitizedUsername.length > 20) {
      return { valid: false, message: 'Username too long (max 20 chars)' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(sanitizedUsername)) {
      return { valid: false, message: 'Only letters, numbers, and underscores' };
    }
    if (users.find(u => u.username === sanitizedUsername)) {
      return { valid: false, message: 'Username already taken' };
    }
    
    const reservedUsernames = ['admin', 'administrator', 'root', 'system', 'support'];
    if (reservedUsernames.includes(sanitizedUsername.toLowerCase())) {
      return { valid: false, message: 'This username is reserved' };
    }
    
    return { valid: true, message: 'Looking good! 👍' };
  }

  checkPasswordStrength = (password) => {
    let strength = 0;
    let hints = [];

    if (password.length >= 8) strength++;
    else hints.push('at least 8 characters');

    if (/[A-Z]/.test(password)) strength++;
    else hints.push('one uppercase letter');

    if (/[a-z]/.test(password)) strength++;
    else hints.push('one lowercase letter');

    if (/[0-9]/.test(password)) strength++;
    else hints.push('one number');

    if (/[^A-Za-z0-9]/.test(password)) strength++;
    else hints.push('one special character');

    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
      strength = 0;
      hints = ['This password is too common'];
    }

    return { strength, hints };
  }

  // Enhanced Authentication Methods
  initializeDefaultAdmin = () => {
    const { admins } = this.state;
    if (admins.length === 0) {
      const newAdmins = [...admins, {
        id: 1,
        username: 'Neurix',
        password: this.hashPassword('Neurix@7217secure'),
        securityCode: 'PasswordHighzacked',
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true,
        role: 'super_admin'
      }];
      this.setState({ admins: newAdmins });
      localStorage.setItem('bookhub_admins', JSON.stringify(newAdmins));
    }
  }

  loginUser = (identifier, password, isAdmin = false) => {
    if (this.state.isLocked) {
      const remainingTime = Math.ceil((this.state.lockUntil - Date.now()) / 60000);
      return { 
        success: false, 
        message: `Account temporarily locked. Try again in ${remainingTime} minutes.` 
      };
    }

    const users = isAdmin ? this.state.admins : this.state.users;
    const sanitizedIdentifier = this.sanitizeInput(identifier);
    const user = users.find(u => 
      u.username === sanitizedIdentifier || u.email === sanitizedIdentifier
    );
    if (!user) {
      this.recordFailedAttempt(sanitizedIdentifier);
      return { success: false, message: 'Invalid credentials' };
    }

    if (!user.isActive) {
      return { success: false, message: 'Account is deactivated' };
    }

    if (!this.verifyPassword(password, user.password)) {
      const shouldLock = this.recordFailedAttempt(sanitizedIdentifier);
      if (shouldLock) {
        return { success: false, message: 'Too many failed attempts. Account locked for 15 minutes.' };
      }
      return { success: false, message: 'Invalid credentials' };
    }

    this.resetFailedAttempts(sanitizedIdentifier);
    
    user.lastLogin = new Date().toISOString();
    
    if (isAdmin) {
      const newAdmins = this.state.admins.map(a => a.id === user.id ? user : a);
      this.setState({ admins: newAdmins });
      localStorage.setItem('bookhub_admins', JSON.stringify(newAdmins));
    } else {
      const newUsers = this.state.users.map(u => u.id === user.id ? user : u);
      this.setState({ users: newUsers });
      localStorage.setItem('bookhub_users', JSON.stringify(newUsers));
    }

    const currentUser = { 
      ...user, 
      isAdmin,
      sessionStart: Date.now()
    };
    
    this.setState({ 
      currentUser,
      showLoginModal: false,
      loginData: { username: '', password: '' }
    });
    
    localStorage.setItem('bookhub_current_user', JSON.stringify(currentUser));
    this.resetSessionTimer();

    return { success: true, user: currentUser };
  }

  loginAdmin = (username, password, securityCode) => {
    if (this.state.isLocked) {
      const remainingTime = Math.ceil((this.state.lockUntil - Date.now()) / 60000);
      return { 
        success: false, 
        message: `Account temporarily locked. Try again in ${remainingTime} minutes.` 
      };
    }

    const sanitizedUsername = this.sanitizeInput(username);
    const admin = this.state.admins.find(a => a.username === sanitizedUsername);

    if (!admin) {
      this.recordFailedAttempt(sanitizedUsername);
      return { success: false, message: 'Invalid admin credentials' };
    }

    if (!this.verifyPassword(password, admin.password)) {
      const shouldLock = this.recordFailedAttempt(sanitizedUsername);
      if (shouldLock) {
        return { success: false, message: 'Too many failed attempts. Account locked for 15 minutes.' };
      }
      return { success: false, message: 'Invalid admin credentials' };
    }

    if (admin.securityCode !== securityCode) {
      this.recordFailedAttempt(sanitizedUsername);
      return { success: false, message: 'Invalid security code' };
    }

    this.resetFailedAttempts(sanitizedUsername);
    
    admin.lastLogin = new Date().toISOString();
    
    const currentUser = { 
      ...admin, 
      isAdmin: true,
      sessionStart: Date.now()
    };
    
    this.setState({ 
      currentUser,
      showLoginModal: false,
      adminData: { username: '', password: '', securityCode: '' }
    });
    
    localStorage.setItem('bookhub_current_user', JSON.stringify(currentUser));
    this.resetSessionTimer();

    return { success: true, user: currentUser };
  }

  // Enhanced User Registration
  registerUser = (userData) => {
    const { users } = this.state;
    
    const usernameValidation = this.validateUsername(userData.username);
    if (!usernameValidation.valid) {
      return { success: false, message: usernameValidation.message };
    }

    const emailValidation = this.validateEmail(userData.email);
    if (!emailValidation.valid) {
      return { success: false, message: emailValidation.message };
    }

    if (userData.password !== userData.confirmPassword) {
      return { success: false, message: 'Passwords do not match' };
    }

    const passwordStrength = this.checkPasswordStrength(userData.password);
    if (passwordStrength.strength < 3) {
      return { 
        success: false, 
        message: `Password too weak. ${passwordStrength.hints.join(', ')}` 
      };
    }

    const newUser = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: this.sanitizeInput(userData.name),
      username: this.sanitizeInput(userData.username),
      email: this.sanitizeInput(userData.email),
      password: this.hashPassword(userData.password),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=2563eb&color=fff`,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isActive: true,
      emailVerified: false,
      role: 'user',
      readingStats: {
        booksRead: 0,
        pagesRead: 0,
        readingTime: 0,
        favoriteGenres: []
      }
    };

    const newUsers = [...users, newUser];
    this.setState({ 
      users: newUsers,
      currentUser: { ...newUser, isAdmin: false },
      showLoginModal: false,
      registerData: { name: '', username: '', email: '', password: '', confirmPassword: '' }
    });
    
    localStorage.setItem('bookhub_users', JSON.stringify(newUsers));
    localStorage.setItem('bookhub_current_user', JSON.stringify({ ...newUser, isAdmin: false }));

    return { success: true, user: newUser };
  }

  // UI Management
  showLoginModal = () => {
    this.setState({ 
      showLoginModal: true,
      activeTab: 'user',
      activeForm: 'user-login'
    });
  }

  hideLoginModal = () => {
    this.setState({ 
      showLoginModal: false
    });
  }

  switchLoginTab = (tab) => {
    this.setState({ 
      activeTab: tab,
      activeForm: tab === 'user' ? 'user-login' : 'admin-login'
    });
  }

  showRegistration = () => {
    this.setState({ activeForm: 'register' });
  }

  showUserLogin = () => {
    this.setState({ 
      activeTab: 'user',
      activeForm: 'user-login'
    });
  }

  // Mobile Menu Toggle
  toggleMobileMenu = () => {
    this.setState(prevState => ({
      isMobileMenuOpen: !prevState.isMobileMenuOpen
    }));
  }

  closeMobileMenu = () => {
    this.setState({ isMobileMenuOpen: false });
  }

  // NEW: Handle Add Book - Redirect to Search
  handleAddBook = () => {
    // Scroll to discover section and focus search
    const discoverSection = document.getElementById('discover');
    if (discoverSection) {
      discoverSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Focus search input after a small delay
    setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder*="Search for books"]');
      if (searchInput) {
        searchInput.focus();
      }
    }, 500);
    
    this.showToast('Search for books to add to your library!', 'info');
  }

  // NEW: Library Filter and Sort Functions
  handleLibraryFilter = (filter) => {
    this.setState({ libraryFilter: filter });
  }

  handleLibrarySort = (sort) => {
    this.setState({ librarySort: sort });
  }

  // NEW: Get filtered and sorted library
  getFilteredSortedLibrary = () => {
    const { userLibrary, libraryFilter, librarySort } = this.state;
    
    let filtered = userLibrary;
    
    // Apply filter
    if (libraryFilter !== 'all') {
      filtered = userLibrary.filter(book => book.status === libraryFilter);
    }
    
    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      switch (librarySort) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'date-added':
          return new Date(b.addedDate) - new Date(a.addedDate);
        case 'progress':
          return (b.currentPage / b.pages) - (a.currentPage / a.pages);
        default:
          return 0;
      }
    });
    
    return sorted;
  }

  // NEW: Update Progress Functions
  showProgressModal = (book) => {
    this.setState({ 
      showProgressModal: true,
      activeBook: book,
      progressData: {
        currentPage: book.currentPage || 0,
        status: book.status || 'to-read'
      }
    });
  }

  hideProgressModal = () => {
    this.setState({ 
      showProgressModal: false,
      activeBook: null
    });
  }

  handleProgressInputChange = (field, value) => {
    this.setState(prevState => ({
      progressData: {
        ...prevState.progressData,
        [field]: value
      }
    }));
  }

  updateBookProgress = (e) => {
    e.preventDefault();
    const { activeBook, progressData, userLibrary } = this.state;
    
    if (!activeBook) return;

    const updatedLibrary = userLibrary.map(book => {
      if (book.id === activeBook.id) {
        const progressPercentage = progressData.currentPage > 0 ? 
          Math.min(100, Math.round((progressData.currentPage / book.pages) * 100)) : 0;
        
        return {
          ...book,
          currentPage: parseInt(progressData.currentPage) || 0,
          status: progressData.status,
          progressPercentage: progressPercentage
        };
      }
      return book;
    });

    this.setState({ 
      userLibrary: updatedLibrary,
      showProgressModal: false
    });

    localStorage.setItem('user_library', JSON.stringify(updatedLibrary));
    this.showToast('Progress updated successfully!', 'success');
  }

  // Review System Methods
  showReviewModal = (book = null) => {
    if (!this.state.currentUser) {
      this.showToast('Please login to write a review', 'warning');
      this.showLoginModal();
      return;
    }
    
    this.setState({ 
      showReviewModal: true,
      activeBook: book,
      reviewData: {
        rating: 0,
        title: '',
        content: '',
        memeReview: ''
      }
    });
  }

  hideReviewModal = () => {
    this.setState({ 
      showReviewModal: false,
      activeBook: null
    });
  }

  handleReviewInputChange = (field, value) => {
    this.setState(prevState => ({
      reviewData: {
        ...prevState.reviewData,
        [field]: value
      }
    }));
  }

  setRating = (rating) => {
    this.setState(prevState => ({
      reviewData: {
        ...prevState.reviewData,
        rating: rating
      }
    }));
  }

  submitReview = (e) => {
    e.preventDefault();
    const { currentUser, activeBook, reviewData, userReviews } = this.state;
    
    if (!currentUser) {
      this.showToast('Please login to submit a review', 'error');
      return;
    }

    if (!activeBook) {
      this.showToast('No book selected for review', 'error');
      return;
    }

    if (reviewData.rating === 0) {
      this.showToast('Please select a rating', 'error');
      return;
    }

    if (!reviewData.title.trim() || !reviewData.content.trim()) {
      this.showToast('Please fill in title and review content', 'error');
      return;
    }

    const existingReview = userReviews.find(review => 
      review.userId === currentUser.id && review.bookId === activeBook.id
    );

    if (existingReview) {
      this.showToast('You have already reviewed this book', 'warning');
      return;
    }

    const newReview = {
      id: 'review_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      bookId: activeBook.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      rating: reviewData.rating,
      title: this.sanitizeInput(reviewData.title),
      content: this.sanitizeInput(reviewData.content),
      memeReview: this.sanitizeInput(reviewData.memeReview) || 'This book gave me all the feels! 📚✨',
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      likedBy: []
    };

    const newUserReviews = [...userReviews, newReview];
    this.setState({ 
      userReviews: newUserReviews,
      showReviewModal: false,
      reviewData: { rating: 0, title: '', content: '', memeReview: '' }
    });

    localStorage.setItem('user_reviews', JSON.stringify(newUserReviews));
    this.showToast('Review submitted successfully! 💫', 'success');
  }

  likeReview = (reviewId) => {
    const { userReviews, currentUser } = this.state;
    
    if (!currentUser) {
      this.showToast('Please login to like reviews', 'warning');
      return;
    }

    const updatedReviews = userReviews.map(review => {
      if (review.id === reviewId) {
        if (!review.likedBy) {
          review.likedBy = [];
        }
        
        if (review.likedBy.includes(currentUser.id)) {
          return {
            ...review,
            likes: review.likes - 1,
            likedBy: review.likedBy.filter(id => id !== currentUser.id)
          };
        } else {
          return {
            ...review,
            likes: review.likes + 1,
            likedBy: [...review.likedBy, currentUser.id]
          };
        }
      }
      return review;
    });

    this.setState({ userReviews: updatedReviews });
    localStorage.setItem('user_reviews', JSON.stringify(updatedReviews));
  }

  // Input Handlers
  handleInputChange = (form, field, value) => {
    this.setState(prevState => ({
      [form]: {
        ...prevState[form],
        [field]: value
      }
    }));
  }

  // Toast Notifications
  showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="flex items-center justify-between">
        <span>${message}</span>
        <button class="ml-4 text-white hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    const container = document.getElementById('toast-container');
    if (container) {
      container.appendChild(toast);
      
      setTimeout(() => toast.classList.add('show'), 100);
      
      toast.querySelector('button').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      });
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 5000);
    }
  }

  // Book Management
  loadSampleData = () => {
    const { userLibrary, userReviews } = this.state;
    
    // REMOVED: The Great Gatsby sample book
    
    if (userReviews.length === 0) {
      const allReviews = [...this.sampleReviews];
      this.setState({ userReviews: allReviews });
      localStorage.setItem('user_reviews', JSON.stringify(allReviews));
    }
  }

  addBookToLibrary = (book) => {
    const { currentUser, userLibrary } = this.state;
    
    if (!currentUser) {
      this.showToast('Please login to add books to your library', 'warning');
      this.showLoginModal();
      return;
    }
    
    if (!userLibrary.find(b => b.id === book.id)) {
      const bookToAdd = {
        ...book,
        currentPage: 0,
        status: 'to-read',
        addedDate: new Date().toISOString(),
        progressPercentage: 0
      };
      
      const newLibrary = [...userLibrary, bookToAdd];
      this.setState({ userLibrary: newLibrary });
      localStorage.setItem('user_library', JSON.stringify(newLibrary));
      this.showToast(`Added "${book.title}" to your library! 📚`, 'success');
    } else {
      this.showToast('Book is already in your library', 'warning');
    }
  }

  // PDF Preview Handler
  handlePDFPreview = (pdfUrl, language = 'English') => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      this.showToast(`Opening ${language} PDF preview...`, 'info');
    } else {
      this.showToast('PDF not available for this book', 'warning');
    }
  }

  // Enhanced Search Functionality
  handleEnhancedSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      this.setState({ showSearchResults: false });
      return;
    }
    
    this.showToast(`Searching for "${searchTerm}"...`, 'warning');
    
    try {
      const response = await fetch(
        `${this.API_CONFIG.GOOGLE_BOOKS.BASE_URL}?q=${encodeURIComponent(searchTerm)}&key=${this.API_CONFIG.GOOGLE_BOOKS.API_KEY}&maxResults=12`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch books from Google Books API');
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const searchResults = data.items.map(item => {
          const bookInfo = item.volumeInfo;
          return {
            id: 'google_' + item.id,
            title: bookInfo.title || 'Unknown Title',
            author: bookInfo.authors ? bookInfo.authors.join(', ') : 'Unknown Author',
            cover: bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail || 'https://via.placeholder.com/150x200/666666/ffffff?text=No+Cover',
            pages: bookInfo.pageCount || 0,
            genre: bookInfo.categories ? bookInfo.categories[0] : 'Unknown Genre',
            description: bookInfo.description || 'No description available',
            contentPreview: bookInfo.previewLink ? 'Preview available' : 'No preview available',
            rating: bookInfo.averageRating || 0,
            reviews: bookInfo.ratingsCount || 0,
            publishedYear: bookInfo.publishedDate ? bookInfo.publishedDate.split('-')[0] : 'Unknown',
            language: bookInfo.language || 'en',
            googleBooksId: item.id,
            previewLink: bookInfo.previewLink,
            infoLink: bookInfo.infoLink,
            isGoogleBook: true
          };
        });
        
        this.setState({ 
          searchResults: searchResults,
          showSearchResults: true,
          activeGenre: 'search'
        });
        
        this.showToast(`Found ${searchResults.length} books matching "${searchTerm}"`, 'success');
      } else {
        this.showToast(`No books found for "${searchTerm}"`, 'error');
        this.setState({ showSearchResults: false });
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showToast('Search failed. Please try again.', 'error');
      this.setState({ showSearchResults: false });
    }
  }

  // Clear search results
  clearSearchResults = () => {
    this.setState({ 
      showSearchResults: false,
      searchResults: [],
      activeGenre: 'all'
    });
  }

  // Book Details Modal
  showBookDetails = async (bookId) => {
    try {
      this.setState({ showBookModal: true, activeBook: null });
      
      let bookData;
      
      if (bookId.startsWith('google_')) {
        bookData = await this.fetchBookFromGoogleAPI(bookId.replace('google_', ''));
      } else {
        bookData = this.sampleBooks.find(b => b.id === bookId) || 
                  this.state.userLibrary.find(b => b.id === bookId) ||
                  this.state.searchResults.find(b => b.id === bookId);
      }
      
      if (bookData) {
        this.setState({ activeBook: bookData });
      } else {
        throw new Error('Book not found');
      }
    } catch (error) {
      console.error('Error loading book details:', error);
      this.showToast('Could not load book details', 'error');
      this.hideBookModal();
    }
  }

  fetchBookFromGoogleAPI = async (bookId) => {
    try {
      const response = await fetch(
        `${this.API_CONFIG.GOOGLE_BOOKS.BASE_URL}/${bookId}?key=${this.API_CONFIG.GOOGLE_BOOKS.API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch book details from Google Books API');
      }
      
      const data = await response.json();
      const bookInfo = data.volumeInfo;
      
      return {
        id: 'google_' + data.id,
        title: bookInfo.title,
        author: bookInfo.authors ? bookInfo.authors.join(', ') : 'Unknown Author',
        cover: bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail || 'https://via.placeholder.com/150x200',
        pages: bookInfo.pageCount || 0,
        genre: bookInfo.categories ? bookInfo.categories[0] : 'Unknown Genre',
        description: bookInfo.description || 'No description available',
        contentPreview: bookInfo.previewLink ? 'Preview available' : 'No preview available',
        rating: bookInfo.averageRating || 0,
        reviews: bookInfo.ratingsCount || 0,
        publishedDate: bookInfo.publishedDate,
        publisher: bookInfo.publisher,
        isbn: bookInfo.industryIdentifiers?.[0]?.identifier || 'N/A',
        language: bookInfo.language || 'en',
        isGoogleBook: true
      };
    } catch (error) {
      console.error('Google Books API Error:', error);
      this.showToast('Could not fetch book details from Google Books', 'error');
      throw error;
    }
  }

  hideBookModal = () => {
    this.setState({ showBookModal: false, activeBook: null });
  }

  // Theme Management
  initializeTheme = () => {
    const savedTheme = localStorage.getItem('bookhub_theme') || 'dark';
    this.applyTheme(savedTheme);
  }

  applyTheme = (theme) => {
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    document.body.className = theme === 'dark' ? 
      'bg-dark text-light min-h-screen relative overflow-x-hidden dark' : 
      'bg-light text-dark min-h-screen relative overflow-x-hidden light';
    
    localStorage.setItem('bookhub_theme', theme);
  }

  toggleTheme = () => {
    const currentTheme = localStorage.getItem('bookhub_theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
  }

  // Render Stars Method
  renderStars = (rating, interactive = false, onStarClick = null) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={
              star <= rating
                ? "fas fa-star text-yellow-400"
                : star - 0.5 <= rating
                ? "fas fa-star-half-alt text-yellow-400"
                : "far fa-star text-yellow-400"
            }
            style={interactive ? { cursor: 'pointer' } : {}}
            onClick={interactive ? () => onStarClick(star) : undefined}
          />
        ))}
      </div>
    );
  }

  // NEW: Render Progress Modal
  renderProgressModal = () => {
    const { showProgressModal, activeBook, progressData } = this.state;

    if (!showProgressModal || !activeBook) return null;

    const progressPercentage = progressData.currentPage > 0 ? 
      Math.min(100, Math.round((progressData.currentPage / activeBook.pages) * 100)) : 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in-up p-4">
        <div className="bg-card rounded-xl p-6 max-w-md w-full mx-auto card-hover relative">
          <button 
            onClick={this.hideProgressModal}
            className="absolute top-3 right-3 text-secondary hover:text-primary-400 transition-colors duration-300 text-lg"
          >
            <i className="fas fa-times"></i>
          </button>

          <h3 className="text-xl font-semibold mb-2 text-center">Update Reading Progress</h3>
          <p className="text-center text-secondary text-sm mb-4">for "{activeBook.title}"</p>

          <form onSubmit={this.updateBookProgress} className="space-y-4">
            {/* Status Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2">Reading Status</label>
              <select 
                value={progressData.status}
                onChange={(e) => this.handleProgressInputChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-300 text-sm"
              >
                <option value="to-read">To Read</option>
                <option value="reading">Currently Reading</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Current Page Input */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Current Page (Total: {activeBook.pages})
              </label>
              <input 
                type="number" 
                min="0"
                max={activeBook.pages}
                value={progressData.currentPage}
                onChange={(e) => this.handleProgressInputChange('currentPage', e.target.value)}
                className="w-full px-3 py-2 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-300 text-sm" 
                placeholder={`Enter current page (0-${activeBook.pages})`}
              />
            </div>

            {/* Progress Display */}
            {progressData.currentPage > 0 && (
              <div className="bg-dark rounded-lg p-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-secondary">Progress</span>
                  <span className="text-sm font-semibold text-primary-400">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-secondary mt-1">
                  {progressData.currentPage} / {activeBook.pages} pages
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={this.hideProgressModal}
                className="flex-1 py-2 border border-secondary text-secondary font-semibold rounded-lg hover:bg-secondary hover:text-white transition-all duration-300 text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all duration-300 text-sm"
              >
                Update Progress
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  renderBookDetailsModal = () => {
    const { activeBook, currentUser, userReviews } = this.state;
    
    if (!activeBook) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    const bookReviews = userReviews.filter(review => review.bookId === activeBook.id);
    const userHasReviewed = currentUser && bookReviews.some(review => review.userId === currentUser.id);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex justify-center">
          <img src={activeBook.cover} alt={activeBook.title} className="book-cover w-full max-w-xs rounded-lg shadow-lg" />
        </div>
        
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold text-primary-400 mb-2">{activeBook.title}</h2>
          <p className="text-xl text-secondary mb-4">by {activeBook.author}</p>
          
          <div className="flex items-center mb-6">
            {this.renderStars(activeBook.rating)}
            <span className="ml-3 text-lg font-semibold">{activeBook.rating}/5</span>
            <span className="ml-2 text-secondary">({activeBook.reviews} reviews)</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-card rounded-lg p-4">
              <div className="text-sm text-secondary">Pages</div>
              <div className="font-semibold">{activeBook.pages}</div>
            </div>
            <div className="bg-card rounded-lg p-4">
              <div className="text-sm text-secondary">Genre</div>
              <div className="font-semibold">{activeBook.genre}</div>
            </div>
            {activeBook.publishedYear && (
              <div className="bg-card rounded-lg p-4">
                <div className="text-sm text-secondary">Published</div>
                <div className="font-semibold">{activeBook.publishedYear}</div>
              </div>
            )}
            {activeBook.language && (
              <div className="bg-card rounded-lg p-4">
                <div className="text-sm text-secondary">Language</div>
                <div className="font-semibold">{activeBook.language}</div>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">About this book</h3>
            <p className="text-secondary leading-relaxed">{activeBook.description}</p>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-8">
            <button 
              onClick={() => this.addBookToLibrary(activeBook)}
              className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors duration-300 flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Add to Library
            </button>
            
            {activeBook.pdfUrl && (
              <button 
                onClick={() => this.handlePDFPreview(activeBook.pdfUrl, 'English')}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300 flex items-center gap-2"
              >
                <i className="fas fa-file-pdf"></i>
                Read English PDF
              </button>
            )}
            
            {activeBook.hindiPdfUrl && (
              <button 
                onClick={() => this.handlePDFPreview(activeBook.hindiPdfUrl, 'Hindi')}
                className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors duration-300 flex items-center gap-2"
              >
                <i className="fas fa-file-pdf"></i>
                Read Hindi PDF
              </button>
            )}
            
            {activeBook.previewLink && activeBook.isGoogleBook && (
              <button 
                onClick={() => window.open(activeBook.previewLink, '_blank')}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2"
              >
                <i className="fas fa-external-link-alt"></i>
                Google Preview
              </button>
            )}
            
            <button 
              onClick={() => this.showReviewModal(activeBook)}
              className={`px-6 py-3 border font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${
                userHasReviewed 
                  ? 'border-gray-500 text-gray-500 cursor-not-allowed' 
                  : 'border-accent text-accent hover:bg-accent hover:text-white'
              }`}
              disabled={userHasReviewed}
            >
              <i className="fas fa-pen"></i>
              {userHasReviewed ? 'Review Submitted' : 'Write Review'}
            </button>
          </div>

          {/* Reviews Section in Book Details */}
          <div className="mt-8">
            <h3 className="text-2xl font-semibold mb-4 text-primary-400">Reader Reviews</h3>
            {bookReviews.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {bookReviews.map(review => (
                  <div key={review.id} className="bg-card rounded-xl p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      <img src={review.userAvatar} alt={review.userName} className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-primary-400">{review.userName}</h4>
                            <div className="flex items-center mt-1">
                              {this.renderStars(review.rating)}
                            </div>
                          </div>
                          <div className="text-sm text-secondary">{review.date}</div>
                        </div>
                      </div>
                    </div>
                    <h5 className="font-semibold text-lg mb-2">{review.title}</h5>
                    <p className="text-secondary mb-3">{review.content}</p>
                    {review.memeReview && (
                      <div className="meme-review bg-dark rounded-lg p-3">
                        <p className="text-sm font-medium text-accent">💡 Vibe Check:</p>
                        <p className="text-sm">{review.memeReview}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-3">
                      <button 
                        onClick={() => this.likeReview(review.id)}
                        className={`reaction-btn flex items-center gap-1 transition-colors duration-300 ${
                          review.likedBy && review.likedBy.includes(this.state.currentUser?.id)
                            ? 'text-red-500'
                            : 'text-secondary hover:text-red-500'
                        }`}
                      >
                        <i className="fas fa-heart"></i> 
                        <span>{review.likes}</span>
                      </button>
                      <button className="text-secondary hover:text-primary-400 transition-colors duration-300">
                        <i className="fas fa-share"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-card rounded-xl">
                <i className="fas fa-comment-slash text-4xl text-secondary mb-3"></i>
                <p className="text-secondary">No reviews yet. Be the first to review this book!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  renderDiscoverBooks = () => {
    const { activeGenre, currentUser, userReviews } = this.state;
    const filteredBooks = activeGenre === 'all' 
      ? this.sampleBooks 
      : this.sampleBooks.filter(book => book.genre === activeGenre);

    return filteredBooks.map(book => {
      const bookReviews = userReviews.filter(review => review.bookId === book.id);
      const userHasReviewed = currentUser && bookReviews.some(review => review.userId === currentUser.id);

      return (
        <div key={book.id} className="bg-dark rounded-2xl p-6 card-hover">
          <div className="flex flex-col items-center text-center">
            <img src={book.cover} alt={book.title} className="book-cover mb-4 rounded-lg shadow-md" />
            <h3 className="text-xl font-semibold text-primary-400 mb-1">{book.title}</h3>
            <p className="text-secondary mb-2">by {book.author}</p>
            <div className="flex items-center mb-3">
              <span className="px-2 py-1 bg-card text-xs rounded-full text-secondary">{book.genre}</span>
              {userHasReviewed && (
                <span className="px-2 py-1 bg-green-600 text-xs rounded-full text-white ml-2">Reviewed</span>
              )}
            </div>
            <div className="flex items-center mb-3">
              {this.renderStars(book.rating)}
              <span className="ml-2 text-sm text-secondary">{book.rating}</span>
            </div>
            <p className="text-sm text-secondary mb-4 line-clamp-3">{book.description}</p>
            <div className="flex space-x-2 w-full">
              <button 
                onClick={() => this.addBookToLibrary(book)}
                className="add-to-library-btn flex-1 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors duration-300"
              >
                Add to Library
              </button>
              <button 
                onClick={() => this.showBookDetails(book.id)}
                className="view-details-btn flex-1 py-2 border border-accent text-accent text-sm rounded-lg hover:bg-accent hover:text-white transition-all duration-300"
              >
                Details
              </button>
            </div>
            <button 
              onClick={() => this.showReviewModal(book)}
              className={`w-full mt-3 py-2 text-sm rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                userHasReviewed 
                  ? 'bg-green-600 text-white cursor-default' 
                  : 'bg-card text-secondary hover:bg-primary-600 hover:text-white'
              }`}
            >
              <i className="fas fa-pen"></i>
              {userHasReviewed ? 'Review Submitted ✓' : 'Write Review'}
            </button>
          </div>
        </div>
      );
    });
  }

  // Render Search Results
  renderSearchResults = () => {
    const { searchResults, currentUser, userReviews } = this.state;
    
    if (searchResults.length === 0) {
      return (
        <div className="col-span-full text-center py-12">
          <i className="fas fa-search text-6xl text-secondary mb-4"></i>
          <h3 className="text-xl font-semibold text-secondary mb-2">No books found</h3>
          <p className="text-secondary">Try searching with different keywords</p>
        </div>
      );
    }

    return searchResults.map(book => {
      const bookReviews = userReviews.filter(review => review.bookId === book.id);
      const userHasReviewed = currentUser && bookReviews.some(review => review.userId === currentUser.id);

      return (
        <div key={book.id} className="bg-dark rounded-2xl p-6 card-hover">
          <div className="flex flex-col items-center text-center">
            <img src={book.cover} alt={book.title} className="book-cover mb-4 rounded-lg shadow-md" />
            <h3 className="text-xl font-semibold text-primary-400 mb-1">{book.title}</h3>
            <p className="text-secondary mb-2">by {book.author}</p>
            <div className="flex items-center mb-3">
              <span className="px-2 py-1 bg-card text-xs rounded-full text-secondary">{book.genre}</span>
              {book.isGoogleBook && (
                <span className="px-2 py-1 bg-blue-600 text-xs rounded-full text-white ml-2">Google Books</span>
              )}
              {userHasReviewed && (
                <span className="px-2 py-1 bg-green-600 text-xs rounded-full text-white ml-2">Reviewed</span>
              )}
            </div>
            <div className="flex items-center mb-3">
              {this.renderStars(book.rating)}
              <span className="ml-2 text-sm text-secondary">{book.rating}</span>
            </div>
            <p className="text-sm text-secondary mb-4 line-clamp-3">{book.description}</p>
            <div className="flex space-x-2 w-full">
              <button 
                onClick={() => this.addBookToLibrary(book)}
                className="add-to-library-btn flex-1 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors duration-300"
              >
                Add to Library
              </button>
              <button 
                onClick={() => this.showBookDetails(book.id)}
                className="view-details-btn flex-1 py-2 border border-accent text-accent text-sm rounded-lg hover:bg-accent hover:text-white transition-all duration-300"
              >
                Details
              </button>
            </div>
            <button 
              onClick={() => this.showReviewModal(book)}
              className={`w-full mt-3 py-2 text-sm rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                userHasReviewed 
                  ? 'bg-green-600 text-white cursor-default' 
                  : 'bg-card text-secondary hover:bg-primary-600 hover:text-white'
              }`}
            >
              <i className="fas fa-pen"></i>
              {userHasReviewed ? 'Review Submitted ✓' : 'Write Review'}
            </button>
          </div>
        </div>
      );
    });
  }

  renderTrendingBooks = () => {
    const trendingBooks = this.sampleBooks.filter(book => book.trending);
    
    return trendingBooks.map(book => (
      <div key={book.id} className="bg-dark rounded-2xl p-6 card-hover relative">
        <div className="absolute top-4 right-4 trending-badge">
          Trending 
        </div>
        <div className="flex flex-col items-center text-center">
          <img src={book.cover} alt={book.title} className="book-cover mb-4 rounded-lg shadow-md" />
          <h3 className="text-xl font-semibold text-primary-400 mb-1">{book.title}</h3>
          <p className="text-secondary mb-2">by {book.author}</p>
          <div className="flex items-center mb-3">
            {this.renderStars(book.rating)}
            <span className="ml-2 text-sm text-secondary">{book.rating} ({book.reviews} reviews)</span>
          </div>
          <p className="text-sm text-secondary mb-4 line-clamp-2">{book.description}</p>
          <div className="flex space-x-2 w-full">
            <button 
              onClick={() => this.addBookToLibrary(book)}
              className="add-to-library-btn flex-1 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors duration-300"
            >
              Add to Library
            </button>
            <button 
              onClick={() => this.showBookDetails(book.id)}
              className="view-details-btn flex-1 py-2 border border-accent text-accent text-sm rounded-lg hover:bg-accent hover:text-white transition-all duration-300"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    ));
  }

  renderReviews = () => {
    const { userReviews, currentUser } = this.state;
    const allReviews = [...userReviews].reverse();

    return allReviews.map(review => {
      const book = this.sampleBooks.find(b => b.id === review.bookId) || 
                  this.state.searchResults.find(b => b.id === review.bookId);

      if (!book) return null;

      return (
        <div key={review.id} className="bg-dark rounded-2xl p-6 card-hover">
          <div className="flex items-start space-x-4 mb-4">
            <img src={review.userAvatar} alt={review.userName} className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-primary-400">{review.userName}</h4>
                  <p className="text-sm text-secondary">Reviewed "{book.title}"</p>
                </div>
                <div className="text-sm text-secondary">{review.date}</div>
              </div>
              <div className="flex items-center mt-2">
                {this.renderStars(review.rating)}
              </div>
            </div>
          </div>
          <h5 className="font-semibold text-lg mb-2">{review.title}</h5>
          <p className="text-secondary mb-4">{review.content}</p>
          <div className="meme-review">
            <p className="text-sm font-medium">💡 Vibe Check:</p>
            <p className="text-sm">{review.memeReview}</p>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-4">
              <button 
                onClick={() => this.likeReview(review.id)}
                className={`reaction-btn flex items-center gap-1 transition-colors duration-300 ${
                  review.likedBy && review.likedBy.includes(currentUser?.id)
                    ? 'text-red-500'
                    : 'text-secondary hover:text-red-500'
                }`}
              >
                <i className="fas fa-heart"></i> 
                <span>{review.likes}</span>
              </button>
              <button className="reaction-btn text-secondary hover:text-primary-400 transition-colors duration-300">
                <i className="fas fa-comment"></i> Reply
              </button>
            </div>
            <button className="text-secondary hover:text-primary-400 transition-colors duration-300">
              <i className="fas fa-share"></i>
            </button>
          </div>
        </div>
      );
    });
  }

  // UPDATED: Render User Library with Filter and Sort
  renderUserLibrary = () => {
    const { currentUser, userReviews, libraryFilter, librarySort } = this.state;
    
    if (!currentUser) {
      return (
        <div className="col-span-full text-center py-12">
          <i className="fas fa-lock text-6xl text-secondary mb-4"></i>
          <h3 className="text-xl font-semibold text-secondary mb-2">Login to access your library</h3>
          <p className="text-secondary">Sign in to view and manage your book collection</p>
        </div>
      );
    }

    const filteredSortedLibrary = this.getFilteredSortedLibrary();

    if (filteredSortedLibrary.length === 0) {
      return (
        <div className="col-span-full text-center py-12">
          <i className="fas fa-book-open text-6xl text-secondary mb-4"></i>
          <h3 className="text-xl font-semibold text-secondary mb-2">Your library is empty</h3>
          <p className="text-secondary">Add some books to get started!</p>
        </div>
      );
    }

    return filteredSortedLibrary.map(book => {
      const bookReviews = userReviews.filter(review => review.bookId === book.id);
      const userHasReviewed = currentUser && bookReviews.some(review => review.userId === currentUser.id);
      const progressPercentage = book.progressPercentage || 
        (book.currentPage > 0 ? Math.min(100, Math.round((book.currentPage / book.pages) * 100)) : 0);

      return (
        <div key={book.id} className="bg-dark rounded-2xl p-6 card-hover">
          <div className="flex items-start space-x-4">
            <img src={book.cover} alt={book.title} className="book-cover rounded-lg w-24 h-32 object-cover" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-primary-400 mb-1">{book.title}</h3>
              <p className="text-secondary mb-2">by {book.author}</p>
              <div className="flex items-center mb-4">
                <span className="px-2 py-1 bg-card text-xs rounded-full text-secondary">{book.genre}</span>
                <span className={`px-2 py-1 text-xs rounded-full text-white ml-2 ${
                  book.status === 'completed' ? 'bg-green-600' :
                  book.status === 'reading' ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  {book.status === 'completed' ? 'Completed' :
                   book.status === 'reading' ? 'Reading' : 'To Read'}
                </span>
                {userHasReviewed && (
                  <span className="px-2 py-1 bg-green-600 text-xs rounded-full text-white ml-2">Reviewed</span>
                )}
              </div>
              
              {/* Progress Section */}
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-secondary">Progress</span>
                  <span className="text-sm font-semibold text-primary-400">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-secondary mt-1">
                  {book.currentPage || 0} / {book.pages} pages
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => this.showProgressModal(book)}
                  className="update-progress-btn flex-1 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors duration-300"
                >
                  Update Progress
                </button>
                <button 
                  onClick={() => this.showBookDetails(book.id)}
                  className="view-details-btn flex-1 py-2 border border-accent text-accent text-sm rounded-lg hover:bg-accent hover:text-white transition-all duration-300"
                >
                  Details
                </button>
              </div>
              <button 
                onClick={() => this.showReviewModal(book)}
                className={`w-full mt-3 py-2 text-sm rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  userHasReviewed 
                    ? 'bg-green-600 text-white cursor-default' 
                    : 'bg-card text-secondary hover:bg-primary-600 hover:text-white'
                }`}
              >
                <i className="fas fa-pen"></i>
                {userHasReviewed ? 'Review Submitted ✓' : 'Write Review'}
              </button>
            </div>
          </div>
        </div>
      );
    });
  }

  // Review Modal
  renderReviewModal = () => {
    const { showReviewModal, activeBook, reviewData, currentUser } = this.state;

    if (!showReviewModal || !activeBook) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in-up p-4">
        <div className="bg-card rounded-xl p-6 max-w-md w-full mx-auto card-hover relative max-h-[85vh] overflow-y-auto">
          <button 
            onClick={this.hideReviewModal}
            className="absolute top-3 right-3 text-secondary hover:text-primary-400 transition-colors duration-300 text-lg"
          >
            <i className="fas fa-times"></i>
          </button>

          <h3 className="text-xl font-semibold mb-2 text-center">Write a Review</h3>
          <p className="text-center text-secondary text-sm mb-4">for "{activeBook.title}"</p>

          <form onSubmit={this.submitReview} className="space-y-4">
            {/* Star Rating */}
            <div className="text-center">
              <label className="block text-sm font-semibold mb-2">Your Rating</label>
              <div className="star-rating text-2xl mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i
                    key={star}
                    className={
                      star <= reviewData.rating
                        ? "fas fa-star text-yellow-400 cursor-pointer"
                        : "far fa-star text-yellow-400 cursor-pointer"
                    }
                    onClick={() => this.setRating(star)}
                    style={{ margin: '0 2px' }}
                  />
                ))}
              </div>
              <p className="text-xs text-secondary">
                {reviewData.rating === 0 ? 'Select your rating' : `${reviewData.rating} out of 5 stars`}
              </p>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-sm font-semibold mb-1">Review Title</label>
              <input 
                type="text" 
                value={reviewData.title}
                onChange={(e) => this.handleReviewInputChange('title', e.target.value)}
                required 
                className="w-full px-3 py-2 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-300 text-sm" 
                placeholder="Give your review a title..." 
                maxLength="60"
              />
            </div>

            {/* Review Content */}
            <div>
              <label className="block text-sm font-semibold mb-1">Your Review</label>
              <textarea 
                value={reviewData.content}
                onChange={(e) => this.handleReviewInputChange('content', e.target.value)}
                required 
                rows="3"
                className="w-full px-3 py-2 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-300 resize-none text-sm" 
                placeholder="Share your thoughts about this book..."
                maxLength="500"
              />
              <div className="text-right text-xs text-secondary mt-1">
                {reviewData.content.length}/500 characters
              </div>
            </div>

            {/* Meme Review (Optional) */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Vibe Check (Optional)
              </label>
              <input 
                type="text" 
                value={reviewData.memeReview}
                onChange={(e) => this.handleReviewInputChange('memeReview', e.target.value)}
                className="w-full px-3 py-2 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-300 text-sm" 
                placeholder="Add a funny one-liner..."
                maxLength="100"
              />
              <div className="text-right text-xs text-secondary mt-1">
                {reviewData.memeReview.length}/100 characters
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={this.hideReviewModal}
                className="flex-1 py-2 border border-secondary text-secondary font-semibold rounded-lg hover:bg-secondary hover:text-white transition-all duration-300 text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all duration-300 text-sm"
              >
                Submit Review
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Event Handlers
  handleUserLogin = (e) => {
    e.preventDefault();
    const { loginData } = this.state;
    
    if (!loginData.username || !loginData.password) {
      this.showToast('Please fill all fields', 'error');
      return;
    }
    
    const result = this.loginUser(loginData.username, loginData.password);
    
    if (result.success) {
      this.showToast('Welcome back!', 'success');
    } else {
      this.showToast(result.message, 'error');
    }
  }

  handleAdminLogin = (e) => {
    e.preventDefault();
    const { adminData } = this.state;
    
    if (!adminData.username || !adminData.password || !adminData.securityCode) {
      this.showToast('Please fill all fields', 'error');
      return;
    }
    
    const result = this.loginAdmin(adminData.username, adminData.password, adminData.securityCode);
    
    if (result.success) {
      this.showToast('Admin access granted!', 'success');
    } else {
      this.showToast(result.message, 'error');
    }
  }

  handleRegistration = (e) => {
    e.preventDefault();
    const { registerData } = this.state;
    
    if (!registerData.name || !registerData.username || !registerData.email || !registerData.password || !registerData.confirmPassword) {
      this.showToast('Please fill all fields', 'error');
      return;
    }
    
    const result = this.registerUser(registerData);
    
    if (result.success) {
      this.showToast('Account created successfully!', 'success');
    } else {
      this.showToast(result.message, 'error');
    }
  }

  handleLogout = () => {
    this.setState({ currentUser: null });
    localStorage.removeItem('bookhub_current_user');
    this.clearSessionTimer();
    this.showToast('Logged out successfully!', 'success');
  }

  handleSearch = (searchTerm) => {
    this.handleEnhancedSearch(searchTerm);
  }

  handleGenreFilter = (genre) => {
    if (genre === 'search') return;
    
    this.setState({ 
      activeGenre: genre,
      showSearchResults: false 
    });
  }

  // Quick search handlers
  handleQuickSearch = (searchTerm) => {
    this.handleEnhancedSearch(searchTerm);
  }

  // Utility Methods
  initializeParticles = () => {
    const container = document.getElementById('particles-container');
    if (!container) return;
    
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle animate-particle-float';
      
      const size = Math.random() * 4 + 1;
      const tx = (Math.random() - 0.5) * 200;
      const ty = (Math.random() - 0.5) * 200;
      const colors = [
        'rgba(37, 99, 235, 0.3)',
        'rgba(6, 182, 212, 0.3)',
        'rgba(16, 185, 129, 0.3)',
        'rgba(245, 158, 11, 0.3)'
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        --tx: ${tx}vw;
        --ty: ${ty}vh;
        animation-duration: ${Math.random() * 15 + 10}s;
        animation-delay: ${Math.random() * 5}s;
      `;
      
      container.appendChild(particle);
    }
  }

  setupEventListeners = () => {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.state.showLoginModal) this.hideLoginModal();
        if (this.state.showBookModal) this.hideBookModal();
        if (this.state.showReviewModal) this.hideReviewModal();
        if (this.state.showProgressModal) this.hideProgressModal();
        if (this.state.isMobileMenuOpen) this.closeMobileMenu();
      }
    });
  }

  renderLoginModal = () => {
    const { showLoginModal, activeTab, activeForm, registerData, loginData, adminData } = this.state;

    if (!showLoginModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in-up">
        <div className="bg-card rounded-2xl p-8 max-w-md w-full mx-4 card-hover relative">
          <button 
            onClick={this.hideLoginModal}
            className="absolute top-4 right-4 text-secondary hover:text-primary-400 transition-colors duration-300 text-xl"
          >
            <i className="fas fa-times"></i>
          </button>

          <h3 className="text-2xl font-semibold mb-6 text-center gradient-text">Join BookHub</h3>
          
          {(activeForm === 'user-login' || activeForm === 'admin-login') && (
            <div className="flex border-b border-gray-600 mb-6">
              <button 
                onClick={() => this.switchLoginTab('user')}
                className={`login-tab flex-1 py-2 font-medium transition-all duration-300 ${
                  activeTab === 'user' 
                    ? 'text-primary-400 border-b-2 border-primary-400' 
                    : 'text-secondary hover:text-primary-300'
                }`}
              >
                User Login
              </button>
              <button 
                onClick={() => this.switchLoginTab('admin')}
                className={`login-tab flex-1 py-2 font-medium transition-all duration-300 ${
                  activeTab === 'admin' 
                    ? 'text-primary-400 border-b-2 border-primary-400' 
                    : 'text-secondary hover:text-primary-300'
                }`}
              >
                Admin Login
              </button>
            </div>
          )}
          
          {activeForm === 'register' && (
            <button 
              onClick={this.showUserLogin}
              className="flex items-center text-secondary hover:text-primary-400 transition-colors duration-300 mb-4 text-sm"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Login
            </button>
          )}
          
          {activeForm === 'user-login' && (
            <form onSubmit={this.handleUserLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Username or Email</label>
                <input 
                  type="text" 
                  value={loginData.username}
                  onChange={(e) => this.handleInputChange('loginData', 'username', e.target.value)}
                  required 
                  className="w-full px-4 py-3 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300" 
                  placeholder="Enter username or email" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Password</label>
                <input 
                  type="password" 
                  value={loginData.password}
                  onChange={(e) => this.handleInputChange('loginData', 'password', e.target.value)}
                  required 
                  className="w-full px-4 py-3 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300" 
                  placeholder="Enter password" 
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="ml-2 text-sm">Remember me</span>
                </label>
                <a href="#" className="text-sm text-primary-400 hover:underline">Forgot password?</a>
              </div>
              <button type="submit" className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all duration-300 transform hover:scale-105">
                Let's Go!!!
              </button>
              
              <div className="text-center text-sm mt-4">
                Don't have an account? <button type="button" onClick={this.showRegistration} className="text-primary-400 hover:underline font-semibold">Sign up now! ✨</button>
              </div>
            </form>
          )}
          
          {activeForm === 'admin-login' && (
            <form onSubmit={this.handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Admin Username</label>
                <input 
                  type="text" 
                  value={adminData.username}
                  onChange={(e) => this.handleInputChange('adminData', 'username', e.target.value)}
                  required 
                  className="w-full px-4 py-3 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300" 
                  placeholder="Enter admin username" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Admin Password</label>
                <input 
                  type="password" 
                  value={adminData.password}
                  onChange={(e) => this.handleInputChange('adminData', 'password', e.target.value)}
                  required 
                  className="w-full px-4 py-3 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300" 
                  placeholder="Enter admin password" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Security Code</label>
                <input 
                  type="text" 
                  value={adminData.securityCode}
                  onChange={(e) => this.handleInputChange('adminData', 'securityCode', e.target.value)}
                  required 
                  className="w-full px-4 py-3 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300" 
                  placeholder="Enter security code" 
                />
              </div>
              <button type="submit" className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all duration-300 transform hover:scale-105">
                Admin Login 
              </button>
            </form>
          )}
          
          {activeForm === 'register' && (
            <form onSubmit={this.handleRegistration} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={registerData.name}
                  onChange={(e) => this.handleInputChange('registerData', 'name', e.target.value)}
                  required 
                  className="w-full px-4 py-3 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300" 
                  placeholder="Enter your Lucky Name" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Username</label>
                <input 
                  type="text" 
                  value={registerData.username}
                  onChange={(e) => this.handleInputChange('registerData', 'username', e.target.value)}
                  required 
                  className="w-full px-4 py-3 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300" 
                  placeholder="Choose a cool username" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input 
                  type="email" 
                  value={registerData.email}
                  onChange={(e) => this.handleInputChange('registerData', 'email', e.target.value)}
                  required 
                  className="w-full px-4 py-3 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300" 
                  placeholder="Enter your email" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Password</label>
                <input 
                  type="password" 
                  value={registerData.password}
                  onChange={(e) => this.handleInputChange('registerData', 'password', e.target.value)}
                  required 
                  className="w-full px-4 py-3 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300" 
                  placeholder="Create a strong password" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                <input 
                  type="password" 
                  value={registerData.confirmPassword}
                  onChange={(e) => this.handleInputChange('registerData', 'confirmPassword', e.target.value)}
                  required 
                  className="w-full px-4 py-3 bg-dark border border-card rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300" 
                  placeholder="Confirm your password" 
                />
              </div>
              <button type="submit" className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all duration-300 transform hover:scale-105">
                Create Account 
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  renderMobileMenu = () => {
    if (!this.state.isMobileMenuOpen) return null;

    return (
      <div className="md:hidden fixed inset-0 z-40 bg-dark/95 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center h-full space-y-8">
          <button 
            onClick={this.closeMobileMenu}
            className="absolute top-6 right-6 text-2xl text-secondary hover:text-primary-400"
          >
            <i className="fas fa-times"></i>
          </button>
          
          <a href="#home" onClick={this.closeMobileMenu} className="nav-link text-2xl text-secondary hover:text-primary-400 transition-colors duration-300">Home</a>
          <a href="#library" onClick={this.closeMobileMenu} className="nav-link text-2xl text-secondary hover:text-primary-400 transition-colors duration-300">My Library</a>
          <a href="#discover" onClick={this.closeMobileMenu} className="nav-link text-2xl text-secondary hover:text-primary-400 transition-colors duration-300">Discover</a>
          <a href="#reviews" onClick={this.closeMobileMenu} className="nav-link text-2xl text-secondary hover:text-primary-400 transition-colors duration-300">Reviews</a>
          <a href="#stats" onClick={this.closeMobileMenu} className="nav-link text-2xl text-secondary hover:text-primary-400 transition-colors duration-300">Stats</a>
          <a href="#trending" onClick={this.closeMobileMenu} className="nav-link text-2xl text-secondary hover:text-primary-400 transition-colors duration-300">Trending</a>
        </div>
      </div>
    );
  }

  render() {
    const { currentUser, showBookModal, showReviewModal, showProgressModal, activeBook, activeGenre, isMobileMenuOpen, showSearchResults, libraryFilter, librarySort } = this.state;

    return (
      <div className="App">
        <div id="toast-container"></div>

        {showBookModal && (
          <div className="book-modal active">
            <div className="book-modal-content">
              <button onClick={this.hideBookModal} className="book-modal-close">
                <i className="fas fa-times"></i>
              </button>
              <div className="p-8">
                {activeBook ? this.renderBookDetailsModal() : (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {this.renderReviewModal()}

        {/* Progress Modal */}
        {this.renderProgressModal()}

        <div className="fixed inset-0 z-0 grid-bg"></div>
        <div id="particles-container" className="fixed inset-0 z-0"></div>

        {/* Mobile Menu */}
        {this.renderMobileMenu()}

        <nav className="fixed top-0 w-full bg-dark/90 backdrop-blur-sm z-50 border-b border-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <a href="#home" className="flex items-center">
                <div className="h-10 w-10 rounded-full mr-2 bg-primary-600 flex items-center justify-center">
                  <i className="fas fa-book text-white"></i>
                </div>
                <span className="text-xl font-bold gradient-text">BookHub</span>
              </a>
              
              <div className="hidden md:flex space-x-8">
                <a href="#home" className="nav-link text-secondary hover:text-primary-400 transition-colors duration-300 font-medium">Home</a>
                <a href="#library" className="nav-link text-secondary hover:text-primary-400 transition-colors duration-300 font-medium">My Library</a>
                <a href="#discover" className="nav-link text-secondary hover:text-primary-400 transition-colors duration-300 font-medium">Discover</a>
                <a href="#reviews" className="nav-link text-secondary hover:text-primary-400 transition-colors duration-300 font-medium">Reviews</a>
                <a href="#stats" className="nav-link text-secondary hover:text-primary-400 transition-colors duration-300 font-medium">Stats</a>
                <a href="#trending" className="nav-link text-secondary hover:text-primary-400 transition-colors duration-300 font-medium">Trending</a>
              </div>

              <div className="flex items-center space-x-4">
                {currentUser && (
                  <div className="flex items-center space-x-2">
                    <img src={currentUser.avatar} alt="User" className="h-8 w-8 rounded-full" />
                    <span className="text-sm font-medium hidden sm:block">{currentUser.name}</span>
                    <button onClick={this.handleLogout} className="text-secondary hover:text-primary-400 transition-colors duration-300">
                      <i className="fas fa-sign-out-alt"></i>
                    </button>
                  </div>
                )}

                <button onClick={this.toggleTheme} className="text-secondary hover:text-primary-400 transition-colors duration-300">
                  <i className="fas fa-moon"></i>
                </button>

                {!currentUser && (
                  <button onClick={this.showLoginModal} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-300 flex items-center gap-2">
                    <i className="fas fa-user"></i>
                    <span className="hidden sm:block">Login</span>
                  </button>
                )}

                <button 
                  onClick={this.toggleMobileMenu}
                  className="md:hidden text-secondary hover:text-primary-400 transition-colors duration-300"
                >
                  <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <section id="home" className="min-h-screen flex items-center pt-20 relative z-10">
          <div className="container mx-auto px-6 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8 animate-fade-in-up">
                <div className="space-y-6">
                  <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                    Read, Review, <span className="gradient-text">Vibe</span>
                  </h1>
                  <p className="text-lg text-secondary leading-relaxed max-w-2xl">
                    Join the lit reading community! Track your books, drop fire reviews, and connect with fellow bookworms.
                  </p>
                </div>

                <div className="relative max-w-xl">
                  <input 
                    type="text" 
                    placeholder="Search for books, authors, or vibes..." 
                    className="w-full px-6 py-4 bg-card border border-card rounded-2xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 pr-12"
                    onKeyPress={(e) => e.key === 'Enter' && this.handleSearch(e.target.value)}
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary hover:text-primary-400 transition-colors duration-300">
                    <i className="fas fa-search text-xl"></i>
                  </button>
                </div>
                <div className="flex space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-400">1.2K+</div>
                    <div className="text-sm text-secondary">Lit Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">567</div>
                    <div className="text-sm text-secondary">Active Readers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">89</div>
                    <div className="text-sm text-secondary">New This Week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="library" className="py-20 bg-card relative z-10">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 gradient-text">My Library </h2>
              <p className="text-lg text-secondary max-w-2xl mx-auto">
                Your personal book collection - organized and lit! 
              </p>
            </div>

            {/* UPDATED: Library Controls */}
            <div className="flex flex-wrap gap-4 mb-8 justify-center">
              <button 
                onClick={this.handleAddBook}
                className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors duration-300 flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Add Book
              </button>
              
              {/* Filter Dropdown */}
              <div className="relative">
                <select 
                  value={libraryFilter}
                  onChange={(e) => this.handleLibraryFilter(e.target.value)}
                  className="px-6 py-3 bg-dark border border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-600 hover:text-white transition-all duration-300 appearance-none pr-10"
                >
                  <option value="all">All Books</option>
                  <option value="to-read">To Read</option>
                  <option value="reading">Reading</option>
                  <option value="completed">Completed</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-primary-600">
                  <i className="fas fa-filter"></i>
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select 
                  value={librarySort}
                  onChange={(e) => this.handleLibrarySort(e.target.value)}
                  className="px-6 py-3 bg-dark border border-accent text-accent font-semibold rounded-lg hover:bg-accent hover:text-white transition-all duration-300 appearance-none pr-10"
                >
                  <option value="title">Sort by Title</option>
                  <option value="author">Sort by Author</option>
                  <option value="date-added">Sort by Date Added</option>
                  <option value="progress">Sort by Progress</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-accent">
                  <i className="fas fa-sort"></i>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {this.renderUserLibrary()}
            </div>
          </div>
        </section>

        <section id="discover" className="py-20 relative z-10">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 gradient-text">
                {showSearchResults ? 'Search Results' : 'Discover New Reads'}
              </h2>
              <p className="text-lg text-secondary max-w-2xl mx-auto">
                {showSearchResults 
                  ? 'Books found from Google Books API' 
                  : 'Find your next obsession! Explore books across genres and vibes.'}
              </p>
            </div>

            {/* Search Results Header */}
            {showSearchResults && (
              <div className="flex justify-between items-center mb-8">
                <button 
                  onClick={this.clearSearchResults}
                  className="px-4 py-2 bg-card text-secondary rounded-lg hover:bg-primary-600 hover:text-white transition-colors duration-300 flex items-center gap-2"
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to All Books
                </button>
                <span className="text-secondary">
                  Found {this.state.searchResults.length} books
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-8 justify-center">
              {!showSearchResults && ['all', 'indian', 'fiction', 'classics'].map(genre => (
                <button
                  key={genre}
                  onClick={() => this.handleGenreFilter(genre)}
                  className={`px-4 py-2 rounded-full transition-all duration-300 ${
                    activeGenre === genre 
                      ? 'bg-primary-600 text-white shadow-lg transform scale-105' 
                      : 'bg-card text-secondary hover:bg-primary-600 hover:text-white hover:transform hover:scale-105'
                  }`}
                >
                  {genre === 'all' ? 'All Genres' : genre.charAt(0).toUpperCase() + genre.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {showSearchResults ? this.renderSearchResults() : this.renderDiscoverBooks()}
            </div>
          </div>
        </section>

        <section id="reviews" className="py-20 bg-card relative z-10">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 gradient-text">Community Reviews </h2>
              <p className="text-lg text-secondary max-w-2xl mx-auto">
                See what the community is saying about their latest reads!!!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {this.renderReviews()}
            </div>
          </div>
        </section>

        {this.renderLoginModal()}
      </div>
    );
  }
}

export default BookHubApp;
