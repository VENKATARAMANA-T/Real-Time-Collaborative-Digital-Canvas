import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Download, Eye, ArrowLeft, Loader2, AlertTriangle, ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';
import PaintCanvas from '../components/Canvas/PaintCanvas';
import MeetingCanvas from '../components/Meeting/Canvas';
import { canvasAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/HomePage/AuthModal';

const SharedCanvas = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const canvasRef = useRef(null);
  const tempCanvasRef = useRef(null);
  const contextRef = useRef(null);
  const tempContextRef = useRef(null);
  const textAreaRef = useRef(null);
  const mainContainerRef = useRef(null);

  const [canvasData, setCanvasData] = useState(null);
  const [elements, setElements] = useState([]);
  const [layers, setLayers] = useState([
    { id: 'layer-1', name: 'Background', visible: true, locked: true, opacity: 1, blendMode: 'normal', bgColor: '#ffffff' }
  ]);
  const [activeLayerId, setActiveLayerId] = useState('layer-1');
  const [canvasBgColor, setCanvasBgColor] = useState('#ffffff');
  const [showCheckerboard, setShowCheckerboard] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [canvasSize, setCanvasSize] = useState({ x: 0, y: 0, width: 1920, height: 1080 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [currPos, setCurrPos] = useState({ x: 0, y: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cloning, setCloning] = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetStartRef = useRef({ x: 0, y: 0 });
  const [authMode, setAuthMode] = useState('login');

  // Load shared canvas data
  useEffect(() => {
    if (!shareToken || !isAuthenticated) return;
    setLoading(true);
    canvasAPI.getSharedCanvas(shareToken)
      .then(canvas => {
        setCanvasData(canvas);
        if (canvas?.data) {
          const data = canvas.data;
          if (data.elements) {
            const restored = data.elements.map(el => {
              if (el.type === 'raster-fill' && el.dataUrl && !el.image) {
                const img = new Image();
                img.src = el.dataUrl;
                return { ...el, image: img };
              }
              return el;
            });
            setElements(restored);
          }
          if (data.layers) {
            // Lock all layers for read-only
            setLayers(data.layers.map(l => ({ ...l, locked: true })));
          }
          if (data.activeLayerId) setActiveLayerId(data.activeLayerId);
          if (data.canvasBgColor) setCanvasBgColor(data.canvasBgColor);
          if (data.showCheckerboard !== undefined) setShowCheckerboard(data.showCheckerboard);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load shared canvas:', err);
        setError('This shared link is invalid or has expired.');
        setLoading(false);
      });
  }, [shareToken, isAuthenticated]);

  const handleClone = async () => {
    setCloning(true);
    try {
      const newCanvas = await canvasAPI.cloneSharedCanvas(shareToken);
      setCloneSuccess(true);
      const isMeeting = canvasData?.isMeetingCanvas;
      setTimeout(() => {
        navigate(isMeeting ? `/meeting-canvas/${newCanvas._id}` : `/paint/${newCanvas._id}`);
      }, 1500);
    } catch (err) {
      console.error('Failed to clone canvas:', err);
      alert('Failed to save canvas. Please try again.');
    } finally {
      setCloning(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(Math.round(prev * 1.2), 500));
  const handleZoomOut = () => setZoom(prev => Math.max(Math.round(prev / 1.2), 10));
  const handleZoomReset = () => { setZoom(100); setPanOffset({ x: 0, y: 0 }); };

  const handlePanMouseDown = (e) => {
    if (e.button === 1 || e.button === 0) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panOffsetStartRef.current = { ...panOffset };
      e.preventDefault();
    }
  };

  const handlePanMouseMove = (e) => {
    if (!isPanning) return;
    const scale = zoom / 100;
    setPanOffset({
      x: panOffsetStartRef.current.x - (e.clientX - panStartRef.current.x) / scale,
      y: panOffsetStartRef.current.y - (e.clientY - panStartRef.current.y) / scale,
    });
  };

  const handlePanMouseUp = () => setIsPanning(false);

  // Wait silently while checking authentication cookies
  if (authLoading) return null;

  if (!isAuthenticated) {
    // Save the shared canvas URL for post-login redirection and redirect to login
    localStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#09090b] text-zinc-100 items-center justify-center">
        <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
        <p className="text-zinc-400 text-lg">Loading shared canvas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#09090b] text-zinc-100 items-center justify-center">
        <AlertTriangle size={48} className="text-red-400 mb-4" />
        <p className="text-zinc-300 text-lg mb-2">Oops!</p>
        <p className="text-zinc-500 mb-6">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden font-sans select-none">
      {/* Top bar */}
      <nav className="h-14 flex items-center px-4 gap-4 text-sm border-b border-zinc-800/40 bg-gradient-to-r from-[#09090b] to-[#18181b] relative z-[100] backdrop-blur-md shadow-lg">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">Dashboard</span>
        </button>

        <div className="h-5 w-[1px] bg-zinc-800" />

        <div className="flex items-center gap-2">
          <Eye size={16} className="text-amber-400" />
          <span className="text-zinc-300 font-semibold">{canvasData?.title || 'Shared Canvas'}</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
            View Only
          </span>
        </div>

        {canvasData?.owner && (
          <span className="text-zinc-500 text-xs">
            Shared by <span className="text-zinc-400">{canvasData.owner.name || canvasData.owner.email}</span>
          </span>
        )}

        <div className="flex-1" />

        {/* Download / Save to my collection */}
        {cloneSuccess ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/15 border border-green-500/25 text-green-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className="text-xs font-bold">Saved! Redirecting...</span>
          </div>
        ) : (
          <button
            onClick={handleClone}
            disabled={cloning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
          >
            {cloning ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {cloning ? 'Saving...' : 'Download & Save to My Collection'}
          </button>
        )}
      </nav>

      {/* Read-only info banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-3">
        <Eye size={14} className="text-amber-400 shrink-0" />
        <p className="text-xs text-amber-200/80">
          <span className="font-semibold">Read-Only Mode</span> — You&apos;re viewing a shared canvas. To edit this canvas, click
          <span className="font-bold text-amber-300"> &quot;Download & Save to My Collection&quot;</span> to save a copy to your Personal Sketches folder and open it in the editor.
        </p>
      </div>

      {/* Canvas view (read-only) */}
      <main className="flex-1 flex relative overflow-hidden bg-[#09090b]">
        {canvasData?.isMeetingCanvas ? (
          /* Meeting Canvas read-only view */
          <MeetingCanvas
            activeTool="selector"
            canEdit={false}
            onCursorMove={() => {}}
            onCursorLeave={() => {}}
            cursors={null}
            settings={{
              brushSize: 5, brushOpacity: 100, brushColor: '#3b82f6', brushStyle: 'edit',
              brushType: 'solid', eraserSize: 20, fillColor: 'transparent', fillOpacity: 100,
              strokeWidth: 4, strokeOpacity: 100, strokeStyle: 'solid', activeShape: 'rectangle',
              noteFillColor: '#fef08a', fontFamily: 'Inter', fontSize: 16, fontWeight: 'normal',
              fontStyle: 'normal', textDecoration: 'none', textAlign: 'center'
            }}
            elements={elements}
            onElementsChange={() => {}}
            onActionStart={() => {}}
            onCanvasClick={() => {}}
            selectedElementId={null}
            onSelectElement={() => {}}
          />
        ) : (
          /* PaintApp Canvas read-only view */
          <div
            ref={mainContainerRef}
            className="flex-1 overflow-hidden bg-transparent flex items-center justify-center relative"
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
            onMouseDown={handlePanMouseDown}
            onMouseMove={handlePanMouseMove}
            onMouseUp={handlePanMouseUp}
            onMouseLeave={handlePanMouseUp}
          >
            <PaintCanvas
            canvasRef={canvasRef}
            tempCanvasRef={tempCanvasRef}
            contextRef={contextRef}
            tempContextRef={tempContextRef}
            textAreaRef={textAreaRef}
            mainContainerRef={mainContainerRef}
            canvasSize={canvasSize}
            setCanvasSize={setCanvasSize}
            zoom={zoom}
            setZoom={setZoom}
            showRulers={false}
            showGridlines={false}
            gridColor="#b0b0b0"
            gridSize={20}
            snapToGrid={false}
            tool="select"
            color="#000000"
            strokeWidth={2}
            opacity={1}
            fillMode="stroke"
            elements={elements}
            setElements={() => {}}
            selectedId={null}
            setSelectedId={() => {}}
            editingId={null}
            setEditingId={() => {}}
            textFormat={{}}
            saveState={() => {}}
            panOffset={panOffset}
            setPanOffset={setPanOffset}
            layers={layers}
            activeLayerId={activeLayerId}
            canvasBgColor={canvasBgColor}
            showCheckerboard={showCheckerboard}
            collaborators={[]}
            aiEnabled={false}
            handleCut={() => {}}
            handlePaste={() => {}}
            clipboard={null}
          />
        </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-zinc-900/90 border border-zinc-700/50 rounded-xl px-2 py-1.5 backdrop-blur-sm shadow-lg z-50">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleZoomReset}
            className="px-2 py-1 rounded-lg hover:bg-zinc-700/50 text-zinc-300 text-xs font-mono font-semibold min-w-[48px] text-center transition-colors"
            title="Reset Zoom"
          >
            {zoom}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <div className="w-[1px] h-5 bg-zinc-700/50 mx-1" />
          <button
            onClick={handleZoomReset}
            className="p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Pan hint */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-zinc-600 text-[10px] z-50">
          <Move size={12} />
          <span>Drag to pan &middot; Ctrl+Scroll to zoom</span>
        </div>
      </main>
    </div>
  );
};

export default SharedCanvas;
