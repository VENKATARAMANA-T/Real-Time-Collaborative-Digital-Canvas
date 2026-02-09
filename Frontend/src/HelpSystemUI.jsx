import React, { useState, useEffect, useRef } from 'react';
import { 
  HelpCircle, Search, BookOpen, Lightbulb, Zap, MessageSquare, 
  ChevronRight, ChevronDown, X, PlayCircle, Info, Settings, Video, 
  Star, Share2, Link as LinkIcon, Clock, Bug, Image as ImageIcon, 
  Upload, Check, Mail, Trash2 
} from 'lucide-react';

export default function HelpSystemUI() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [mode, setMode] = useState('beginner');
  const [loading, setLoading] = useState(true);
  const [hoveredElement, setHoveredElement] = useState(null);
  const [walkthroughActive, setWalkthroughActive] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [videoComments, setVideoComments] = useState({
    0: [],
    1: []
  });
  const [commentInput, setCommentInput] = useState({
    0: '',
    1: ''
  });
  
  // Advanced States
  const [bookmarks, setBookmarks] = useState([1]); 
  const [recentViewed, setRecentViewed] = useState([2, 5]);

  // Feedback Form States
  const [feedbackType, setFeedbackType] = useState('general');
  const [feedbackRating, setFeedbackRating] = useState(0); 
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // File Upload States
  const [attachedFile, setAttachedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setMode(prev => prev === 'beginner' ? 'advanced' : 'beginner');
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsDarkMode(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowFeedback(false);
        setWalkthroughActive(false);
        setExpandedFaq(null);
        document.activeElement?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Rating Logic ---
  const handleStarHover = (e, starIndex) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const ratingValue = x < width / 2 ? starIndex - 0.5 : starIndex;
    setHoverRating(ratingValue);
  };

  // --- File Upload Logic ---
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setAttachedFile({
        file,
        preview: e.target.result,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddComment = (videoIndex) => {
    if (commentInput[videoIndex].trim() === '') return;
    
    const newComment = {
      id: Date.now(),
      text: commentInput[videoIndex],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setVideoComments(prev => ({
      ...prev,
      [videoIndex]: [...prev[videoIndex], newComment]
    }));
    
    setCommentInput(prev => ({
      ...prev,
      [videoIndex]: ''
    }));
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowFeedback(false);
        setFeedbackRating(0);
        setFeedbackType('general');
        setAttachedFile(null);
      }, 2000);
    }, 1500);
  };

  const toggleBookmark = (id) => {
    if (bookmarks.includes(id)) {
      setBookmarks(bookmarks.filter(b => b !== id));
    } else {
      setBookmarks([...bookmarks, id]);
    }
  };

  const helpArticles = [
    { 
      id: 1, 
      title: 'Getting Started Guide', 
      category: 'Basics', 
      icon: PlayCircle, 
      readTime: '5 min',
      details: {
        intro: 'Welcome to our Digital Canvas Application! This guide will help you get started with creating beautiful artwork.',
        sections: [
          {
            title: 'Welcome to the Digital Canvas Application',
            content: 'Our Digital Canvas application is a full-featured drawing and painting tool designed for both beginners and professionals. Whether you\'re sketching quick ideas or creating detailed artwork, you\'ll find all the tools you need.'
          },
          {
            title: '1. Understanding the Canvas',
            content: 'The canvas is your main workspace where you create your artwork. It\'s the white or transparent area in the center of the screen. You can resize the canvas and create projects of any size. The canvas supports multiple layers for advanced editing.'
          },
          {
            title: '2. Essential Tools',
            content: 'Brush Tool: Select and customize brush styles, sizes, and opacity for painting. Eraser: Remove parts of your artwork. Pick Color: Click anywhere to select colors from your canvas. Shape Tools: Create geometric shapes like rectangles, circles, and lines. Text Tool: Add text to your artwork with custom fonts and sizes.'
          },
          {
            title: '3. Working with Colors',
            content: 'Access the color palette from the toolbar. Click the color square to open the color picker. Adjust hue, saturation, and brightness using the sliders. Save your favorite colors to the palette for quick access. Use the eyedropper tool to sample colors from your canvas.'
          },
          {
            title: '4. Brush Customization',
            content: 'Size: Adjust brush size from 1px to 200px for different effects. Opacity: Control transparency from 0% (invisible) to 100% (fully opaque). Hardness: Choose between soft and hard edges. Flow: Control how much color is applied with each stroke.'
          },
          {
            title: '5. Undo and Redo',
            content: 'Use Ctrl+Z to undo your last action and Ctrl+Y to redo. Access the history panel to jump to any previous state. You can have up to 100 undo steps (configurable in settings).'
          },
          {
            title: '6. Saving Your Work',
            content: 'Save your projects in our native format (.paint) to preserve all layers and settings. Export as PNG, JPG, or other formats for sharing. Use File > Save As to create backups of your work. Auto-save is enabled by default every 5 minutes.'
          },
          {
            title: '7. Keyboard Shortcuts for Beginners',
            content: 'B: Brush tool | E: Eraser | C: Color picker | Z: Zoom tool | Ctrl+Z: Undo | Ctrl+Y: Redo | Ctrl+S: Save | Ctrl+E: Export | Spacebar: Pan/Move canvas'
          },
          {
            title: 'Tips for Getting Started',
            content: '• Start with the brush tool and practice basic strokes • Experiment with different brush sizes and opacity settings • Use layers to organize your artwork • Take advantage of the color palette for consistency • Save frequently to avoid losing work'
          }
        ]
      }
    },
    { 
      id: 2, 
      title: 'Understanding Tools', 
      category: 'Features', 
      icon: Settings, 
      readTime: '8 min',
      details: {
        intro: 'Master all the powerful tools available in your Digital Canvas application. From basic drawing tools to advanced shape creation and selection features.',
        sections: [
          {
            title: 'Selection Tools',
            content: 'Rectangle Select: Select rectangular areas of your canvas. Hold Shift to add to selection or Alt to subtract. Perfect for isolating and editing specific regions. Free Select: Draw custom shapes to select exactly what you need. Great for precise selections around irregular objects.'
          },
          {
            title: 'Drawing Tools',
            content: 'Pencil Tool: Hard-edged drawing tool for precise lines and sketches. Best for technical drawings and detailed work. Paintbrush Tool: Soft-edged brush for natural painting effects. Ideal for artistic work, illustrations, and digital painting. Great for blending and smooth strokes.'
          },
          {
            title: 'Eraser Tool',
            content: 'Erase sections of your artwork with full control. Adjust eraser size and hardness for different effects. Soft eraser creates feathered edges for smooth transitions. Hard eraser provides clean, sharp edges. Use Alt+Click to quickly switch between brush and eraser while painting.'
          },
          {
            title: 'Color Picker (Eyedropper)',
            content: 'Sample colors directly from your canvas. Click any color to select it as your foreground color. Useful for maintaining color consistency across your artwork. Press "I" key for quick access. Displays the RGB and HEX values of selected colors for precise color matching.'
          },
          {
            title: 'Shape Tools',
            content: 'Rectangle: Draw perfect rectangles with customizable fill and stroke. Circle/Ellipse: Create circular and elliptical shapes with precise control. Line: Draw straight lines at any angle with adjustable thickness. Polygon: Create multi-sided shapes by clicking points. Free Shape: Draw any custom shape with smooth curves.'
          },
          {
            title: 'Text Tool',
            content: 'Add text to your artwork with custom fonts and sizes. Click where you want text and start typing. Font Selection: Choose from hundreds of installed fonts. Size Control: Adjust text size from 8px to 200px. Color: Apply any color from your palette. Styling: Add bold, italic, underline, and strikethrough effects.'
          },
          {
            title: 'Zoom and Pan Tools',
            content: 'Zoom In/Out: Use the zoom tool to magnify areas for detailed work or zoom out to see the whole canvas. Keyboard shortcuts: Press "+" to zoom in, "-" to zoom out, "0" for 100% view, "Fit" for fit-to-window. Pan/Move: Hold Spacebar and drag to move around your canvas without changing tools.'
          },
          {
            title: 'Color Palette & Swatches',
            content: 'Access the full color spectrum with the integrated color picker. Hue/Saturation/Brightness sliders for precise color control. Save frequently used colors to your custom palette for quick access. Color history shows recently used colors. Import/export color palettes for consistency across projects.'
          },
          {
            title: 'Brushes Panel',
            content: 'Pre-designed brush presets for various artistic effects. Round Brush: Classic soft brush for general painting. Hard Brush: Crisp-edged brush for precise work. Textured Brushes: Create special effects like chalk, oil, watercolor, and more. Dry Brush: Creates rough, sketchy strokes. Smudge Brush: Blend colors and create smooth transitions.'
          },
          {
            title: 'Image Tools',
            content: 'Transform Tool: Resize and rotate your entire image or selected content. Flip: Mirror your artwork horizontally or vertically. Crop: Remove unnecessary areas and adjust canvas size. Adjust: Modify brightness, contrast, saturation, and hue of your artwork.'
          },
          {
            title: 'Layers Panel',
            content: 'Create multiple layers to organize your work. Layers allow non-destructive editing and easy changes. Move objects between layers by dragging. Adjust layer opacity for blending effects. Blend modes create special effects between layers. Group layers for better organization. Lock layers to prevent accidental edits.'
          },
          {
            title: 'Advanced Features',
            content: 'Gradient Tool: Create smooth color transitions. Copy/Paste: Duplicate parts of your artwork. Clone Tool: Copy texture from one area to another. Blur/Sharpen: Apply image adjustments. Flip & Rotate: Transform your artwork at any angle. Undo/Redo: Extensive history with up to 100 steps.'
          }
        ]
      }
    },
    { 
      id: 3, 
      title: 'Keyboard Shortcuts', 
      category: 'Productivity', 
      icon: Zap, 
      readTime: '4 min',
      details: {
        intro: 'Learn keyboard shortcuts to speed up your workflow and become more productive in the Digital Canvas application.',
        sections: [
          {
            title: 'File Operations',
            content: 'Ctrl+N: Create a new project. Ctrl+O: Open an existing project. Ctrl+S: Save your current work. Ctrl+Shift+S: Save As (save with a new name). Ctrl+E: Export your artwork as image. Ctrl+P: Print your artwork.'
          },
          {
            title: 'Edit Operations',
            content: 'Ctrl+Z: Undo last action. Ctrl+Y: Redo action. Ctrl+A: Select all content. Ctrl+C: Copy selected content. Ctrl+X: Cut selected content. Ctrl+V: Paste copied content. Ctrl+D: Deselect. Delete: Remove selected content.'
          },
          {
            title: 'Tool Shortcuts',
            content: 'B: Activate Brush tool. P: Activate Pencil tool. E: Activate Eraser tool. I: Activate Color Picker (Eyedropper). Z: Activate Zoom tool. R: Activate Rectangle Select tool. L: Activate Free Select tool. T: Activate Text tool. S: Activate Shape tools.'
          },
          {
            title: 'Canvas Navigation',
            content: 'Spacebar + Drag: Pan/move around canvas. Scroll Wheel: Zoom in and out. +: Zoom in. -: Zoom out. 0: Fit canvas to window. 1: 100% zoom level. Ctrl+Scroll: Fine zoom control. Home: Go to top-left corner.'
          },
          {
            title: 'View Options',
            content: 'F: Toggle fullscreen mode. H: Hide/show toolbars. Tab: Hide/show all panels. Shift+Tab: Hide/show all panels except toolbox. V: Toggle rulers. G: Toggle grid. Shift+Ctrl+I: Invert view.'
          },
          {
            title: 'Layer Operations',
            content: 'Ctrl+Shift+N: Create new layer. Ctrl+Shift+D: Duplicate current layer. Ctrl+Shift+E: Merge down layers. Ctrl+Shift+M: Merge visible layers. Page Up: Select layer above. Page Down: Select layer below. Alt+Up: Raise layer. Alt+Down: Lower layer.'
          },
          {
            title: 'Transform Operations',
            content: 'Ctrl+T: Open transform dialog. Ctrl+H: Flip horizontally. Ctrl+Shift+V: Flip vertically. Ctrl+R: Rotate 90 degrees clockwise. Ctrl+Shift+R: Rotate 90 degrees counter-clockwise. Ctrl+[: Decrease brush size. Ctrl+]: Increase brush size.'
          },
          {
            title: 'Brush and Color Shortcuts',
            content: '[ and ]: Decrease/increase brush size. ( and ): Decrease/increase opacity. , and .: Decrease/increase flow rate. Alt+Click: Pick color from canvas. X: Swap foreground and background colors. D: Reset to default black/white. 1-9: Quick select brush preset.'
          },
          {
            title: 'Pro Tips',
            content: 'Hold Shift while drawing lines to constrain to straight angles. Hold Alt while dragging to duplicate selection. Hold Ctrl to temporarily switch to color picker. Hold Spacebar and drag to pan without changing tool. Double-click layer to rename it.'
          }
        ]
      }
    },
    { 
      id: 4, 
      title: 'Advanced Techniques', 
      category: 'Advanced', 
      icon: Lightbulb, 
      readTime: '10 min',
      details: {
        intro: 'Master advanced techniques to create professional-quality artwork and unlock the full potential of the Digital Canvas application.',
        sections: [
          {
            title: 'Layer Masking and Blending',
            content: 'Create layer masks for non-destructive editing. Right-click layer > Add Layer Mask to create a mask. Paint with black to hide content, white to reveal. Use gray for transparency levels. Blend Modes: Change how layers interact with those below. Try Multiply for shadows, Screen for light effects, Overlay for contrast enhancement. Opacity Control: Adjust individual layer opacity for seamless blending.'
          },
          {
            title: 'Advanced Selection Techniques',
            content: 'Select by Color: Click similar colors to select. Shift+Click to add to selection. Alt+Click to subtract. Feather Selection: Soften selection edges for smooth transitions. Select > Feather and choose radius. Grow/Shrink: Expand or contract selection. Use Select > Grow to increase or Select > Shrink to decrease. Anti-aliasing: Smooth jagged edges automatically enabled.'
          },
          {
            title: 'Using Gradients Effectively',
            content: 'Gradient Tool: Create smooth color transitions. Click and drag to define gradient direction. Hold Shift to constrain to 45-degree angles. Gradient Types: Linear (straight), Radial (circular), Conical (spiral). Custom Gradients: Create and save your own gradient presets. Right-click in gradient area > Save Custom Gradient.'
          },
          {
            title: 'Cloning and Healing',
            content: 'Clone Tool: Copy texture from source to target. Alt+Click to set source point, then paint to clone. Perfect for removing blemishes or copying textures. Healing Brush: Similar to clone but blends edges. Great for seamless corrections. Sample Option: Choose to sample from current layer or all layers.'
          },
          {
            title: 'Non-Destructive Workflow',
            content: 'Always duplicate layers before major edits. Keep original artwork on base layer. Use adjustment layers for color/tone changes. Link layers with chain icon for grouped transformations. Convert to smart objects for flexible transformations. Save project as .psd for full editability later.'
          },
          {
            title: 'Advanced Color Techniques',
            content: 'Color Balance: Adjust color in shadows, midtones, and highlights separately. Hue/Saturation: Target specific color ranges for adjustment. Curves: Precise control over tones and colors. Color to Alpha: Make specific colors transparent. Posterize: Create stylized artwork with limited colors.'
          },
          {
            title: 'Working with Text Layers',
            content: 'Text as Vector: Resize without quality loss. Warp Text: Apply distortion effects to text. Text on Path: Align text along custom curves or shapes. Rasterize: Convert text to pixels for painting effects. Multiple Text Layers: Create complex typography compositions. Font Substitution: Auto-replace missing fonts.'
          },
          {
            title: 'Filter and Effects',
            content: 'Blur Effects: Gaussian Blur for softness, Motion Blur for speed. Distortion: Apply warping, twirl, spherize effects. Artistic: Oil Paint, Watercolor, Sketch effects. Sharpen: Enhance details and edges. Smart Filters: Apply filters non-destructively. Adjust parameters anytime without quality loss.'
          },
          {
            title: 'Path and Bezier Curves',
            content: 'Create precise paths for controlled selections and strokes. Bezier Tool: Click to create anchor points, drag handles for curves. Convert Points: Change between straight and curved segments. Stroke Path: Apply brush or pencil along path. Fill Path: Fill selection area with color or pattern. Path Operations: Combine, subtract, and intersect paths.'
          },
          {
            title: 'Performance Optimization',
            content: 'Merge visible layers to reduce file size. Flatten image when done editing. Convert 16-bit to 8-bit for faster processing. Reduce history steps if working with large files. Close unused palettes and panels. Use lower resolution for initial composition. Scale up only when final. Disable visibility of hidden layers during export.'
          },
          {
            title: 'Professional Export Workflow',
            content: 'Export for Web: Optimize file size and quality. Use PNG for transparency, JPG for photos. Batch Export: Save multiple formats at once. Metadata: Embed artist info and copyright. Color Profile: Ensure accurate colors across devices. DPI Settings: Use 300 DPI for print, 72 for web.'
          }
        ]
      }
    },
    { 
      id: 5, 
      title: 'Video Tutorials', 
      category: 'Learning', 
      icon: Video, 
      readTime: '15 min',
      details: {
        intro: 'Watch our comprehensive video tutorials to learn Digital Canvas features step by step. Add your own videos by replacing the video links below.',
        sections: [
          {
            title: 'Getting Started & Tools Overview',
            content: 'Video URL: Add your getting started and tools overview video. Cover canvas basics, tool introduction, and main features. Recommended length: 10-15 minutes.'
          },
          {
            title: 'Advanced Techniques & Workflow',
            content: 'Video URL: Add your advanced techniques and workflow video. Demonstrate professional techniques, blending modes, layers, and complete project workflow. Recommended length: 15-20 minutes.'
          }
        ]
      }
    },
    { 
      id: 6, 
      title: 'Troubleshooting', 
      category: 'Support', 
      icon: HelpCircle, 
      readTime: '7 min',
      details: {
        intro: 'Experiencing issues? Find solutions to common problems and get your Digital Canvas application running smoothly.',
        sections: [
          {
            title: 'Application Won\'t Start',
            content: 'Issue: Application crashes on startup or won\'t open. Solution 1: Restart your computer and try again. Solution 2: Uninstall and reinstall the application. Solution 3: Check if your system meets minimum requirements (Windows 10+, 4GB RAM, 500MB disk space). Solution 4: Disable any conflicting third-party software or antivirus temporarily. Solution 5: Check graphics driver is up to date - visit manufacturer website to update.'
          },
          {
            title: 'Application Freezing or Lagging',
            content: 'Issue: Application becomes slow or unresponsive. Solution 1: Close unnecessary background applications to free up RAM. Solution 2: Reduce canvas size or resolution. Solution 3: Reduce the number of layers and merge layers when possible. Solution 4: Disable preview options in View menu. Solution 5: Reduce undo history steps in Settings > Performance. Solution 6: Clear temporary files: Go to Settings > Cache > Clear Cache. Solution 7: Restart the application.'
          },
          {
            title: 'Brush or Drawing Issues',
            content: 'Issue: Brush not working or drawing appears distorted. Solution 1: Try a different brush preset to isolate the issue. Solution 2: Reset brush settings: Brush > Reset to Defaults. Solution 3: Check brush opacity is not set to 0%. Solution 4: Ensure correct layer is selected (check Layers panel). Solution 5: Undo to previous state if brush behaves strangely. Solution 6: Try on a new layer to verify the issue. Solution 7: Update graphics drivers.'
          },
          {
            title: 'Color Picker Not Working',
            content: 'Issue: Eyedropper tool not sampling colors correctly. Solution 1: Press "I" to ensure color picker tool is active. Solution 2: Make sure you\'re clicking on the canvas area with content. Solution 3: Try clicking on different colors to verify functionality. Solution 4: Check if layer is locked - unlock in Layers panel. Solution 5: Try sampling on a different layer. Solution 6: Restart the application if issue persists.'
          },
          {
            title: 'Undo/Redo Not Working',
            content: 'Issue: Cannot undo recent actions or undo history is empty. Solution 1: Press Ctrl+Z to undo (not Ctrl+Y which is redo). Solution 2: Check Edit menu > Undo to see available actions. Solution 3: Increase history steps in Settings > History > Max Undo Steps. Solution 4: Undo history is cleared when you save - this is normal. Solution 5: Create multiple save points if you need to preserve history. Solution 6: Restart application if undo becomes unresponsive.'
          },
          {
            title: 'Cannot Save or Export Files',
            content: 'Issue: Save/Export operation fails or file not created. Solution 1: Check disk space - ensure at least 500MB free. Solution 2: Verify you have write permissions to the folder. Solution 3: Try saving to Documents folder if having issues with other locations. Solution 4: Use different filename - special characters may cause issues. Solution 5: For export, choose supported format (PNG, JPG, BMP, TIFF). Solution 6: Close other applications that might lock files. Solution 7: Try Save As instead of Save.'
          },
          {
            title: 'Layer Issues',
            content: 'Issue: Cannot create new layers or layers disappear. Solution 1: Check layer limit hasn\'t been reached (usually 999 layers max). Solution 2: Try flattening image first: Image > Flatten Image. Solution 3: Verify layers panel is visible - View > Layers. Solution 4: Accidentally deleted layer - use Undo (Ctrl+Z). Solution 5: Layer might be hidden - check eye icon in Layers panel. Solution 6: If layer locked, unlock it by clicking lock icon. Solution 7: Restart application if layer operations become unresponsive.'
          },
          {
            title: 'Performance and Memory Issues',
            content: 'Issue: High RAM usage or "Out of Memory" error. Solution 1: Close other applications to free up system memory. Solution 2: Reduce canvas resolution for working draft. Solution 3: Merge layers to reduce memory usage. Solution 4: Reduce undo history: Settings > Performance > Max Undo Steps. Solution 5: Switch to 8-bit color mode if 16-bit is too heavy. Solution 6: Disable unnecessary visual effects and previews. Solution 7: Increase virtual memory/pagefile size in Windows settings. Solution 8: Upgrade system RAM if frequently hitting limits.'
          },
          {
            title: 'Display and Graphics Issues',
            content: 'Issue: Canvas not displaying correctly, colors wrong, or graphics glitches. Solution 1: Update graphics drivers to latest version. Solution 2: Disable graphics acceleration: Settings > Display > Hardware Acceleration (toggle off). Solution 3: Restart application. Solution 4: Try windowed mode vs fullscreen. Solution 5: Adjust display color profile: Settings > Color > Calibrate. Solution 6: Try different color space (RGB vs CMYK). Solution 7: Check monitor settings - resolution and refresh rate. Solution 8: Try on different monitor if available.'
          },
          {
            title: 'Import and File Format Issues',
            content: 'Issue: Cannot open files or wrong format error. Solution 1: Ensure file format is supported (.psd, .png, .jpg, .bmp, .tiff, .gif). Solution 2: Check file isn\'t corrupted - try opening with another application first. Solution 3: Verify file isn\'t locked by another application. Solution 4: Try renaming file extension if misnamed. Solution 5: For PSD files, ensure Photoshop plugin is installed. Solution 6: Try File > Open Recent if file was previously opened. Solution 7: Check file permissions - ensure you have read access.'
          },
          {
            title: 'General Troubleshooting Steps',
            content: 'First try: Restart the application. Second: Restart your computer. Third: Check for application updates in Settings > About > Check for Updates. Fourth: Disable any extensions or plugins: Settings > Extensions. Fifth: Reset application settings to defaults: Settings > Reset Settings > Confirm. Sixth: Check Windows updates are installed. Seventh: Run in compatibility mode if on newer Windows version. Eighth: Reinstall application as last resort.'
          },
          {
            title: 'Getting Help and Support',
            content: 'If issues persist after troubleshooting: 1. Check Help > FAQ or search in Help Center. 2. Visit our support website: support.digitalcanvas.com. 3. Contact support team: support@digitalcanvas.com. 4. Provide error message and steps to reproduce. 5. Include system info: Help > System Information. 6. Attach screenshot of issue. 7. Join community forum for peer support. 8. Submit bug report with detailed description.'
          }
        ]
      }
    }
  ];

  const faqs = [
    { q: 'How do I start using the platform?', a: 'Begin with our Getting Started guide or activate the interactive walkthrough from the help menu.' },
    { q: 'What are the keyboard shortcuts?', a: 'Press Ctrl+K to view all shortcuts, or hover over any tool to see its specific shortcut.' },
    { q: 'Can I switch between beginner and advanced mode?', a: 'Yes! Use the mode toggle in Settings or the top navigation bar.' },
    { q: 'How do I get contextual help?', a: 'Hover over any tool or feature to see tooltips. Click the help icon for detailed information.' },
    { q: 'Where can I provide feedback?', a: 'Click the feedback button in the bottom right corner or use the dedicated feedback option in the help menu.' }
  ];

  const walkthroughSteps = [
    { 
      title: 'Welcome to Help Center!', 
      desc: 'Let\'s take a quick tour to help you get started with all the features.',
      element: 'header',
      highlight: { top: '0', left: '0', right: '0', height: '64px' }
    },
    { 
      title: 'Search Anything', 
      desc: 'Use this search bar to instantly find help articles, tutorials, and FAQs.',
      element: 'search',
      highlight: { top: '96px', left: '50%', transform: 'translateX(-50%)', width: '672px', height: '64px' }
    },
    { 
      title: 'Quick Access Cards', 
      desc: 'These cards give you instant access to common tasks.',
      element: 'cards',
      highlight: { top: '200px', left: '50%', transform: 'translateX(-50%)', width: '1200px', height: '140px' }
    },
    { 
      title: 'You\'re All Set!', 
      desc: 'You now know the basics. Start exploring!',
      element: 'complete',
      highlight: null
    }
  ];

  const filteredArticles = helpArticles.filter(article => {
    const query = searchQuery.toLowerCase();
    const titleMatch = article.title.toLowerCase().includes(query);
    const categoryMatch = article.category.toLowerCase().includes(query);
    const introMatch = article.details?.intro.toLowerCase().includes(query);
    const contentMatch = article.details?.sections.some(section => 
      section.title.toLowerCase().includes(query) || 
      section.content.toLowerCase().includes(query)
    );
    return titleMatch || categoryMatch || introMatch || contentMatch;
  });

  const filteredFaqs = faqs.filter(faq => {
    const query = searchQuery.toLowerCase();
    return faq.q.toLowerCase().includes(query) || faq.a.toLowerCase().includes(query);
  });

  const SkeletonCard = () => (
    <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border animate-pulse transition-colors duration-300`}>
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 rounded-lg transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className="flex-1 space-y-3">
          <div className={`h-3 w-16 rounded transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`h-4 w-3/4 rounded transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`h-3 w-full rounded transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>
      </div>
    </div>
  );

  const ContextualTooltip = ({ id, title, description, shortcut }) => {
    if (mode !== 'beginner' || hoveredElement !== id) return null;
    return (
      <div className="absolute z-50 w-64 pointer-events-none" style={{ top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' }}>
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-4 shadow-2xl`}>
          <div className="flex items-start space-x-2 mb-2">
            <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">{title}</h4>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
              {shortcut && (
                <div className="mt-2">
                  <kbd className={`px-2 py-1 text-xs rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>{shortcut}</kbd>
                </div>
              )}
            </div>
          </div>
          <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l border-t`} />
        </div>
      </div>
    );
  };

  const WalkthroughHighlight = () => {
    if (!walkthroughActive || !walkthroughSteps[walkthroughStep].highlight) return null;
    const highlight = walkthroughSteps[walkthroughStep].highlight;
    return (
      <div className="fixed inset-0 z-50 overflow-hidden" style={{ pointerEvents: 'none' }}>
        <div className="absolute transition-all duration-500 ease-in-out" style={{ ...highlight, boxShadow: '0 0 0 4px #6366f1, 0 0 0 4000px rgba(0, 0, 0, 0.75)', borderRadius: '12px' }}>
          <div className="absolute inset-0 rounded-xl border-2 border-indigo-400 animate-ping opacity-30"></div>
        </div>
        <div className="absolute transition-all duration-500 ease-out" style={{ top: highlight.top ? `calc(${highlight.top} + ${highlight.height || '0px'} + 24px)` : '50%', left: '50%', transform: 'translateX(-50%)', maxWidth: '420px', width: '90%', pointerEvents: 'auto' }}>
          <div className={`${isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-white'} backdrop-blur-sm rounded-2xl p-6 shadow-2xl border`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">{walkthroughStep + 1}</div>
                <h3 className="text-lg font-bold">{walkthroughSteps[walkthroughStep].title}</h3>
              </div>
              <button 
                onClick={() => { setWalkthroughActive(false); setWalkthroughStep(0); }} 
                className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-indigo-50 text-gray-400 hover:text-indigo-600'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={`mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{walkthroughSteps[walkthroughStep].desc}</p>
            <div className="flex items-center justify-between">
              <div className="flex space-x-1.5">
                {walkthroughSteps.map((_, idx) => ( <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === walkthroughStep ? 'bg-indigo-600 w-6' : isDarkMode ? 'bg-gray-600 w-1.5' : 'bg-gray-300 w-1.5'}`} /> ))}
              </div>
              <div className="flex space-x-3">
                {walkthroughStep > 0 && ( <button onClick={() => setWalkthroughStep(walkthroughStep - 1)} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors duration-200`}>Back</button> )}
                <button onClick={() => { if (walkthroughStep < walkthroughSteps.length - 1) { setWalkthroughStep(walkthroughStep + 1); } else { setWalkthroughActive(false); setWalkthroughStep(0); } }} className="px-6 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg transition-all duration-200">{walkthroughStep < walkthroughSteps.length - 1 ? 'Next' : 'Finish'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900'} transition-colors duration-300 ease-in-out`}>
      {walkthroughActive && <WalkthroughHighlight />}
      
      <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-sm border-gray-200'} border-b sticky top-0 z-40 transition-all duration-300 ease-in-out`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className={`${isDarkMode ? 'bg-indigo-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600'} p-2 rounded-lg transition-colors duration-300`}><BookOpen className="w-6 h-6 text-white" /></div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Help Center</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative" onMouseEnter={() => mode === 'beginner' && setHoveredElement('mode-toggle')} onMouseLeave={() => setHoveredElement(null)}>
                <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors duration-300`}>
                  <button onClick={() => setMode('beginner')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${mode === 'beginner' ? 'bg-indigo-600 text-white shadow-lg' : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Beginner</button>
                  <button onClick={() => setMode('advanced')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${mode === 'advanced' ? 'bg-purple-600 text-white shadow-lg' : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Advanced</button>
                </div>
                <ContextualTooltip id="mode-toggle" title="Learning Mode" description="Beginner shows tooltips. Advanced provides streamlined experience." shortcut="Ctrl+M" />
              </div>

              <div className="relative" onMouseEnter={() => mode === 'beginner' && setHoveredElement('theme-toggle')} onMouseLeave={() => setHoveredElement(null)}>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="relative w-24 h-12 rounded-full focus:outline-none overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ background: isDarkMode ? 'linear-gradient(to right, #1e293b, #334155)' : 'linear-gradient(to right, #7dd3fc, #60a5fa)', transition: 'background 0.3s ease-in-out' }}>
                  <div className={`absolute inset-0 transition-opacity duration-300 ${isDarkMode ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ top: '12px', left: '20px' }} /><div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ top: '28px', left: '30px', animationDelay: '0.3s' }} />
                  </div>
                  <div className={`absolute right-6 top-1/2 -translate-y-1/2 transition-all duration-300 ${!isDarkMode ? 'opacity-90 scale-100' : 'opacity-0 scale-75'}`}>
                    <div className="relative"><div className="w-7 h-4 bg-white rounded-full" /><div className="absolute -top-2 left-1.5 w-5 h-5 bg-white rounded-full" /></div>
                  </div>
                  <div className="absolute top-1.5 rounded-full shadow-2xl" style={{ width: '36px', height: '36px', left: isDarkMode ? 'calc(100% - 42px)' : '6px', background: isDarkMode ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' : '#fbbf24', transform: isDarkMode ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    {isDarkMode && (<div className="relative w-full h-full"><div className="absolute w-2 h-2 bg-gray-400 rounded-full" style={{ top: '8px', left: '14px', opacity: 0.4 }} /></div>)}
                  </div>
                </button>
                <ContextualTooltip id="theme-toggle" title="Theme Switcher" description="Toggle between light and dark mode." shortcut="Ctrl+Shift+D" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder={mode === 'advanced' ? "Cmd+K to search..." : "Search help articles, tutorials, and FAQs..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 shadow-lg'} border focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ease-in-out`}
            />
            {mode === 'advanced' && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex space-x-1">
                 <kbd className={`px-2 py-1 text-xs rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} text-gray-500`}>Ctrl</kbd>
                 <kbd className={`px-2 py-1 text-xs rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} text-gray-500`}>K</kbd>
              </div>
            )}
          </div>
        </div>

        {mode === 'advanced' && !loading && (
          <div className="mb-8 animate-fade-in">
             <div className="flex items-center space-x-2 mb-4">
                <Clock className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h2 className="text-lg font-bold">Recently Viewed</h2>
             </div>
             <div className="flex gap-4 overflow-x-auto pb-4">
                {recentViewed.map(id => {
                   const item = helpArticles.find(a => a.id === id);
                   if(!item) return null;
                   return (
                      <div key={id} className={`flex-shrink-0 w-64 p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} flex items-center space-x-3 cursor-pointer hover:shadow-md transition-all`}>
                         <div className={`p-2 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}><item.icon className="w-4 h-4 text-indigo-500" /></div>
                         <div className="truncate"><div className="text-sm font-medium truncate">{item.title}</div><div className="text-xs text-gray-500">{item.readTime} read</div></div>
                      </div>
                   )
                })}
             </div>
          </div>
        )}

        {mode === 'beginner' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {loading ? (<><SkeletonCard /><SkeletonCard /><SkeletonCard /></>) : (
              <>
                <button onClick={() => { setWalkthroughActive(true); setWalkthroughStep(0); }} className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:shadow-xl border-gray-200'} border transition-all duration-300 ease-in-out group`}>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500"><PlayCircle className="w-6 h-6 text-white" /></div>
                    <div className="flex-1 text-left"><h3 className="font-semibold mb-1">Start Walkthrough</h3><p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Interactive guided tour</p></div>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </button>
                <button className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:shadow-xl border-gray-200'} border transition-all duration-300 ease-in-out group`}>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500"><Zap className="w-6 h-6 text-white" /></div>
                    <div className="flex-1 text-left"><h3 className="font-semibold mb-1">Keyboard Shortcuts</h3><p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Work faster with hotkeys</p></div>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </button>
                <button onClick={() => setShowFeedback(true)} className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:shadow-xl border-gray-200'} border transition-all duration-300 ease-in-out group`}>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-teal-500"><MessageSquare className="w-6 h-6 text-white" /></div>
                    <div className="flex-1 text-left"><h3 className="font-semibold mb-1">Send Feedback</h3><p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Help us improve</p></div>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </button>
              </>
            )}
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Help Articles</h2>
            {mode === 'advanced' && ( <span className={`text-sm px-3 py-1 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Compact View Active</span> )}
          </div>

          <div className={mode === 'advanced' ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
            {loading ? ( <>{[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}</> ) : filteredArticles.length > 0 ? (
              filteredArticles.map((article) => {
                if (mode === 'advanced') {
                   const isBookmarked = bookmarks.includes(article.id);
                   return (
                      <div key={article.id} className={`group flex items-center justify-between p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:shadow-md'} transition-all duration-200 cursor-pointer`}>
                         <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}><article.icon className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /></div>
                            <div><h3 className="font-semibold text-sm">{article.title}</h3><p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{article.category} • {article.readTime}</p></div>
                         </div>
                         <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><Share2 className="w-4 h-4" /></button>
                            <button className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><LinkIcon className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); toggleBookmark(article.id); }} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${isBookmarked ? 'text-yellow-500' : isDarkMode ? 'text-gray-400' : 'text-gray-300'}`}><Star className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} /></button>
                         </div>
                      </div>
                   );
                }
                return (
                  <div key={article.id} onClick={() => setSelectedArticleId(article.id)} className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:shadow-xl border-gray-200'} border transition-all duration-300 ease-in-out cursor-pointer group`}>
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}><article.icon className={`w-6 h-6 transition-colors duration-300 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /></div>
                      <div className="flex-1"><span className={`text-xs font-medium transition-colors duration-300 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{article.category}</span><h3 className="font-semibold mt-1 mb-2 group-hover:text-indigo-600 transition-colors duration-300">{article.title}</h3><p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Learn more about this topic</p></div>
                    </div>
                  </div>
                );
              })
            ) : searchQuery ? (
              <div className={`col-span-full p-8 rounded-xl text-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No articles found matching "{searchQuery}"</p>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Try different keywords or browse all articles</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => (
                <div key={idx} className={`rounded-xl transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                  <button onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)} className="w-full p-6 flex items-center justify-between"><span className="font-semibold text-left">{faq.q}</span><ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expandedFaq === idx ? 'rotate-180' : ''}`} /></button>
                  {expandedFaq === idx && (<div className={`px-6 pb-6 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{faq.a}</div>)}
                </div>
              ))
            ) : searchQuery ? (
              <div className={`p-8 rounded-xl text-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No FAQs found matching "{searchQuery}"</p>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {/* ARTICLE DETAIL MODAL */}
      {selectedArticleId && helpArticles.find(a => a.id === selectedArticleId)?.details && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
            
            {/* Modal Header */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} flex items-center justify-between sticky top-0 bg-inherit z-10`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
                  {helpArticles.find(a => a.id === selectedArticleId)?.icon && React.createElement(helpArticles.find(a => a.id === selectedArticleId).icon, { className: "w-6 h-6 text-white" })}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{helpArticles.find(a => a.id === selectedArticleId)?.title}</h3>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{helpArticles.find(a => a.id === selectedArticleId)?.details.intro}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedArticleId(null)} 
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-indigo-50 text-gray-400 hover:text-indigo-600'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable Content */}
            <div className="p-8 overflow-y-auto space-y-6">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-indigo-900/30 border-indigo-800' : 'bg-indigo-50 border-indigo-200'} border`}>
                <p className="text-lg">{helpArticles.find(a => a.id === selectedArticleId)?.details.intro}</p>
              </div>

              {selectedArticleId === 5 ? (
                // Video Tutorials Layout
                <div className="space-y-8">
                  {helpArticles.find(a => a.id === selectedArticleId)?.details.sections.map((section, idx) => (
                    <div key={idx} className="space-y-4">
                      <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{section.title}</h4>
                      
                      {/* Blank Video Player */}
                      <div className={`relative w-full aspect-video rounded-xl overflow-hidden ${isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-black border-gray-400'} border-2 flex items-center justify-center group hover:shadow-lg transition-shadow duration-300`}>
                        <video 
                          className="w-full h-full object-cover"
                          controls
                          controlsList="nodownload"
                          poster={isDarkMode ? '#1f2937' : '#000000'}
                        >
                          <source src="" type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        
                        {/* Overlay with instructions */}
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center group-hover:bg-black/50 transition-all duration-300 pointer-events-none">
                          <div className="text-center">
                            <div className={`w-20 h-20 mx-auto mb-4 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-700'} flex items-center justify-center`}>
                              <Video className="w-10 h-10 text-white" />
                            </div>
                            <p className="text-white font-semibold text-lg">Video #{idx + 1}</p>
                            <p className="text-gray-300 text-sm mt-2">Add MP4 or Video URL here</p>
                          </div>
                        </div>
                      </div>

                      {/* Video Description/Instructions */}
                      <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{section.content}</p>
                      </div>

                      {/* Video Comments Section */}
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                        <h5 className="font-semibold mb-3 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Comments ({videoComments[idx].length})
                        </h5>
                        <div className="space-y-3">
                          {/* Display Comments */}
                          {videoComments[idx].length > 0 ? (
                            videoComments[idx].map((comment) => (
                              <div key={comment.id} className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className="font-medium text-sm">Your Comment</p>
                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{comment.text}</p>
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{comment.timestamp}</p>
                              </div>
                            ))
                          ) : (
                            <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No comments yet. Be the first to comment!</p>
                            </div>
                          )}

                          {/* Add Comment Input */}
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} mt-3 pt-3 space-y-2`}>
                            <textarea 
                              value={commentInput[idx]}
                              onChange={(e) => setCommentInput(prev => ({ ...prev, [idx]: e.target.value }))}
                              placeholder="Share your thoughts or ask a question..."
                              rows="2"
                              className={`w-full px-3 py-2 rounded text-sm resize-none ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            />
                            <button 
                              onClick={() => handleAddComment(idx)}
                              disabled={commentInput[idx].trim() === ''}
                              className="w-full px-3 py-2 rounded text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                              Post Comment
                            </button>
                          </div>
                        </div>
                      </div>

                      {idx < helpArticles.find(a => a.id === selectedArticleId)?.details.sections.length - 1 && (
                        <div className={`my-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Regular Article Layout
                <>
                  {helpArticles.find(a => a.id === selectedArticleId)?.details.sections.map((section, idx) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{section.title}</h4>
                      <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{section.content}</p>
                      {idx < helpArticles.find(a => a.id === selectedArticleId)?.details.sections.length - 1 && (
                        <div className={`my-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} sticky bottom-0 bg-inherit flex items-center justify-between`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {helpArticles.find(a => a.id === selectedArticleId)?.readTime} read
              </div>
              <button 
                onClick={() => setSelectedArticleId(null)}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK FORM MODAL */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
            
            {/* Modal Header */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} flex items-center justify-between sticky top-0 bg-inherit z-10`}>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-500" />
                  Help us improve
                </h3>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your feedback helps us make the platform better for everyone.
                </p>
              </div>
              {/* UPDATED CLOSE BUTTON: PURPLE HOVER THEME */}
              <button 
                onClick={() => setShowFeedback(false)} 
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-indigo-50 text-gray-400 hover:text-indigo-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8">
              {!submitSuccess ? (
                <form onSubmit={handleFeedbackSubmit} className="space-y-8">
                  
                  {/* Section 1: Feedback Type */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold uppercase tracking-wider opacity-70">I want to...</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { id: 'bug', icon: Bug, label: 'Report Issue' },
                        { id: 'feature', icon: Lightbulb, label: 'Request Feature' },
                        { id: 'general', icon: MessageSquare, label: 'General Feedback' }
                      ].map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFeedbackType(type.id)}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                            feedbackType === type.id 
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                              : `border-transparent ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`
                          }`}
                        >
                          <type.icon className="w-6 h-6" />
                          <span className="font-medium text-sm">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Precise Rating */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold uppercase tracking-wider opacity-70">How was your experience? ({hoverRating || feedbackRating} / 5)</label>
                    <div className="flex gap-2" onMouseLeave={() => setHoverRating(0)}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="relative p-1 focus:outline-none transition-transform hover:scale-110"
                          onMouseMove={(e) => handleStarHover(e, star)}
                          onClick={() => setFeedbackRating(hoverRating)}
                        >
                          {/* Empty Star Background */}
                          <Star className={`w-8 h-8 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                          
                          {/* Filled Star Overlay (Clipped) */}
                          <div 
                            className="absolute top-1 left-1 overflow-hidden pointer-events-none"
                            style={{ 
                              width: (hoverRating || feedbackRating) >= star 
                                ? '100%' 
                                : (hoverRating || feedbackRating) >= star - 0.5 
                                  ? '50%' 
                                  : '0%' 
                            }}
                          >
                             <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Details */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Description</label>
                      <textarea 
                        rows="4"
                        placeholder="Tell us more about what happened or what you'd like to see..."
                        className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none`}
                      ></textarea>
                    </div>
                  </div>

                  {/* Section 4: Functional Image Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Attachments (Optional)</label>
                    {!attachedFile ? (
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                          isDragging 
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                            : isDarkMode 
                              ? 'border-gray-600 hover:border-gray-500 bg-gray-700/30' 
                              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-sm`}>
                            <Upload className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold text-indigo-500">Click to upload</span> or drag and drop
                          </div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>PNG, JPG, or GIF (max. 5MB)</p>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden" 
                          accept="image/*"
                        />
                      </div>
                    ) : (
                      // Preview State
                      <div className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <img src={attachedFile.preview} alt="Preview" className="w-10 h-10 rounded object-cover border border-gray-200" />
                          <div className="flex flex-col">
                             <span className="text-sm font-medium truncate max-w-[200px]">{attachedFile.name}</span>
                             <span className="text-xs text-green-500">Ready to upload</span>
                          </div>
                        </div>
                        <button type="button" onClick={removeAttachment} className="p-2 hover:bg-red-100 rounded-full group">
                          <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Section 5: Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Contact Email</label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <input 
                        type="email" 
                        placeholder="name@example.com"
                        className={`w-full pl-10 p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} focus:ring-2 focus:ring-indigo-500 outline-none`}
                      />
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                    <button 
                      type="button"
                      onClick={() => setShowFeedback(false)}
                      className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-400 hover:text-indigo-400' : 'text-gray-500 hover:text-indigo-600 hover:bg-transparent'}`}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : 'Submit Feedback'}
                    </button>
                  </div>
                </form>
              ) : (
                // Success State
                <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Thank you!</h3>
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Your feedback has been received. We appreciate your input!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`@keyframes twinkle { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.8); } } .animate-twinkle { animation: twinkle 2s ease-in-out infinite; } .animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
