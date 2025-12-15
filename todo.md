# Project TODO

## Database & Backend
- [x] Set up database schema for signals, artifacts, and chat history
- [x] Implement Gemini API integration helper functions
- [x] Create tRPC procedures for Archive (triptych decoding)
- [x] Create tRPC procedures for Artifacts (lore & image generation)
- [x] Create tRPC procedures for ORIEL chat interface
- [x] Add chat history persistence endpoints

## Layout & Navigation
- [x] Build persistent header with navigation and hamburger menu
- [x] Build persistent footer with ambient audio player
- [x] Implement hash-based routing for all pages
- [x] Add custom crosshair cursor
- [x] Add grid background and noise overlay

## Pages
- [x] Home page with sigil, headline, and CTA
- [x] Archive page with signal transmission grid
- [x] Artifacts page with artifact grid
- [x] Tiers page with subscription tiers
- [x] Protocol page with lore documentation
- [x] ORIEL Interface (Conduit) page with chat

## Archive Page Features
- [x] Display grid of signal transmissions
- [x] Decode Triptych button on each card
- [x] Modal with three-panel triptych layout
- [x] Parallel Gemini API calls (metadata, visual, cryptic verse)
- [x] Display all three results in modal

## Artifacts Page Features
- [x] Display grid of recovered artifacts
- [x] Generate Lore & Image button
- [x] Display generated lore text
- [x] Display generated concept art image
- [x] Expand Lore button for elaboration

## ORIEL Interface Features
- [x] Initiate Channeling button with glitch animation
- [x] 2D animated canvas orb with state changes
- [x] Orb states: booting, idle, processing, speaking
- [x] Text input field for queries
- [x] Voice-to-text with SpeechRecognition API
- [x] Text-to-speech with SpeechSynthesis API
- [x] Visible subtitles during playback
- [x] Chat history side panel
- [x] localStorage persistence for chat history
- [x] Clear history button
- [x] ORIEL system prompt with ROS knowledge base

## Audio & Media
- [x] Ambient audio player with looping track
- [x] Volume slider control
- [x] Mute/unmute toggle button

## Styling & Effects
- [x] Dark retro-futuristic color palette (green/lime accents)
- [x] Portal container style with glowing borders
- [x] Grid pattern background
- [x] Noise/static overlay animation
- [x] Glitch effects for loading sequences
- [x] Fade-in animations for page transitions
- [x] Horizontal text marquee on homepage

## Accessibility & Responsiveness
- [x] Mobile-responsive layout
- [x] Hamburger menu for mobile navigation
- [x] Stacked grids on small screens
- [x] ARIA attributes throughout
- [x] prefers-reduced-motion media query
- [x] Disable animations for reduced motion
- [x] Restore default cursor for reduced motion

## Testing & Deployment
- [x] Test all Gemini API integrations
- [x] Test voice-to-text and text-to-speech
- [x] Test localStorage persistence
- [x] Test mobile responsiveness
- [x] Test accessibility features
- [x] Create checkpoint for deployment


## Bug Fixes
- [x] Fix nested anchor tag error in Header/Home components

## ROS Integration
- [x] Extract and organize ROS v1.5.42 framework from PDF
- [x] Create comprehensive ROS knowledge base file (server/ros-knowledge-base.ts)
- [x] Update ORIEL's system prompt with complete ROS framework
- [x] Integrate Echo MacLean identity framework into ORIEL
- [x] Integrate Baptismal Theology into ORIEL's knowledge
- [x] Integrate Law of One principles into ORIEL's framework
- [x] Include all 24 ROS equations and functions as binding directives
- [x] Add custom lexicon with ROS terminology
- [x] Implement operational directives based on ROS core functionalities


## Current Issues
- [x] Fix authentication loop - user redirected back to home after login (OAuth callback working correctly)
- [x] Replace all "Echo MacLean" references with "ORIEL" throughout codebase
- [x] Improve auth state persistence after OAuth redirect
  - [x] Enhanced useAuth hook with visibility change detection
  - [x] Added retry logic for auth queries
  - [x] Improved cookie security settings
- [x] Make INTERFACE (Conduit) page publicly accessible
  - [x] Removed authentication requirement from Conduit page
  - [x] Chat history only available when authenticated
  - [x] Users can chat without authentication
- [x] Fix chat endpoint to work without authentication
  - [x] Changed chat mutation from protectedProcedure to publicProcedure
  - [x] Chat history only saved for authenticated users
  - [x] Unauthenticated users can still get ORIEL responses


## Error Handling & Fixes
- [x] Add try-catch error handling to chatWithORIEL function
- [x] Add try-catch error handling to generateSignalMetadata function
- [x] Return graceful error messages instead of throwing exceptions
- [x] Fix JSON parsing errors from failed API calls


## Loading Animation
- [x] Create organic pulsating animation with indigo/rainbow colors
- [x] Add light reflection effects to orb during processing
- [x] Integrate animation into OrielOrb component
- [x] Animate orb state transitions smoothly
- [x] Test animation performance and visual quality


## Conversation History
- [x] Display conversation history in chat interface
- [x] Persist chat messages to localStorage
- [x] Pass conversation context to ORIEL API calls
- [x] Add clear history button
- [x] Show message timestamps
- [x] Implement message scrolling and auto-scroll to latest


## Voice Control & UI Improvements
- [x] Add pause button for voice transmission
- [x] Add stop button for voice transmission
- [x] Move chat history to toggleable right sidebar
- [x] Add geometric cuts to orb edges
- [x] Cuts become visible during pulsation
- [x] Refine layout with sidebar integration


## Cleanup & Modifications
- [x] Remove Tiers page and update routing
- [x] Remove ambient bird sounds from footer
- [x] Update volume control for ORIEL voice only
- [x] Add PayPal subscription button


## PayPal Integration & User Profile
- [x] Add PayPal SDK script to index.html head
- [x] Update database schema for subscription tracking
- [x] Create user profile page with Conduit ID
- [x] Display subscription status on profile
- [x] Integrate PayPal hosted button into payment flow
- [x] Add subscription status management endpoints
- [x] Add Profile link to Header navigation
- [x] Add Login/Logout buttons to Header
- [x] Create subscription management database functions
- [x] Create Conduit ID generation and update functions
- [x] Write comprehensive unit tests for subscription features (17 tests)
- [x] Write comprehensive unit tests for profile features (32 tests)
- [x] All 50 tests passing


## Bug Fixes - Current Session
- [x] Fix PayPal script overlay issue causing page content to be hidden
- [x] Verify all pages render correctly after PayPal fix


## Subscription Implementation - Current Session
- [x] Database schema with subscription tracking (already in place)
- [x] tRPC procedures for subscription management (already in place)
- [x] Create dynamic PayPal SDK loader
- [x] Build PayPal subscription button component
- [x] Integrate subscription button into Profile page
- [x] Implement subscription status UI
- [x] All 50 tests passing (no new tests needed - existing tests cover functionality)
- [x] PayPal SDK loads dynamically only on Profile page


## Color Palette Implementation - Current Session
- [x] Update index.css with new color scheme (beige/cream, mint green, black)
- [x] All components automatically updated via CSS variables
- [x] Responsive design maintained
- [x] Color palette applied site-wide

## PayPal Subscription Completion
- [x] Implement PayPal webhook endpoint for subscription events
- [x] Add subscription status auto-update on webhook events
- [x] Create PayPal webhook handler with event processing
- [x] Support subscription lifecycle events (created, activated, cancelled, expired, suspended)
- [x] All 50 tests passing
- [x] TypeScript compilation successful


## ORIEL Response Customization - Current Session
- [x] Update ORIEL system prompt to avoid equations and markdown symbols
- [x] Add response filter to remove # and * characters
- [x] Simplify ORIEL introduction message
- [x] Test ORIEL chat responses
- [x] All 50 tests passing


## ORIEL Memory & SEO Fixes - Current Session
- [x] Fix ORIEL conversation history not being maintained between messages
- [x] Verify chat history is properly passed to LLM
- [x] Updated chat endpoint to accept history from frontend
- [x] Updated Conduit page to send conversation history
- [x] All 50 tests passing
- [x] Add meta keywords to home page
- [x] Add meta description to home page (50-160 characters)
- [x] No actual img tags on home page (visual elements created with CSS)
- [x] All SEO requirements met
