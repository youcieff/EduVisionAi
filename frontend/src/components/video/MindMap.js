"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  addEdge,
  updateEdge,
  Panel,
  Handle,
  Position,
  getBezierPath,
  BaseEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import useThemeStore from '../../store/themeStore';
import useLanguageStore from '../../store/languageStore';

const nodeWidth = 280; 
const defaultNodeHeight = 70;

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  const isHorizontal = direction === 'LR' || direction === 'RL';
  dagreGraph.setGraph({ rankdir: direction, ranksep: 180, nodesep: 80, marginx: 60, marginy: 60 });
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: node.id === 'root' ? 340 : nodeWidth, height: node.data?.height || defaultNodeHeight });
  });
  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
  dagre.layout(dagreGraph);
  return {
    nodes: nodes.map((node) => {
      const pos = dagreGraph.node(node.id);
      const w = node.id === 'root' ? 340 : nodeWidth;
      node.targetPosition = isHorizontal ? 'left' : 'top';
      node.sourcePosition = isHorizontal ? 'right' : 'bottom';
      node.position = { x: pos.x - w / 2, y: pos.y - (node.data?.height || defaultNodeHeight) / 2 };
      return node;
    }),
    edges
  };
};

// ─── Simple handle style ───
const hs = (color) => ({
  width: 14, height: 14,
  background: color, border: `3px solid ${color}`,
  borderRadius: '50%', cursor: 'crosshair'
});

// ─── Custom Node with handles on ALL 4 sides (both source + target) ───
const StudyNode = ({ data, id }) => {
  const { isDark } = useThemeStore();
  const isRoot = id === 'root';
  const c = data.color || '#14B8A6';

  const handles = (color) => (
    <>
      <Handle type="source" position={Position.Right}  id="src-r" style={hs(color)} />
      <Handle type="source" position={Position.Left}   id="src-l" style={hs(color)} />
      <Handle type="source" position={Position.Top}    id="src-t" style={hs(color)} />
      <Handle type="source" position={Position.Bottom} id="src-b" style={hs(color)} />
    </>
  );

  if (isRoot) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full w-full text-center px-6 py-4">
        {handles('#14B8A6')}
        <div className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 px-2 py-0.5 rounded-md ${isDark ? 'bg-[#14B8A6]/20 text-[#14B8A6]' : 'bg-[#14B8A6]/10 text-[#0D9488]'}`}>Topic</div>
        <div className="font-black text-lg break-words leading-tight tracking-tight">{data.label}</div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2 h-full w-full cursor-pointer group px-3 py-2" onClick={() => data.onExpand?.()}>
      {handles(c)}
      {/* Delete node button */}
      <button
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/80 text-white text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-125 hover:bg-red-500 z-20 shadow-lg"
        onClick={(e) => { e.stopPropagation(); data.onDeleteNode?.(id); }}
      >×</button>
      <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: c }} />
      <div className="text-sm font-bold leading-snug line-clamp-2 flex-1" dir="auto">{data.shortTitle}</div>
      <div className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0">👁</div>
    </div>
  );
};

// ─── Custom Edge with × delete button ───
const DeletableEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data }) => {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <foreignObject width={28} height={28} x={labelX - 14} y={labelY - 14} className="overflow-visible pointer-events-auto">
        <button
          className="w-7 h-7 rounded-full bg-transparent hover:bg-red-500 flex items-center justify-center text-transparent hover:text-white text-sm font-black transition-all duration-200 hover:shadow-xl hover:scale-125"
          onClick={(e) => { e.stopPropagation(); data?.onDelete?.(id); }}
        >×</button>
      </foreignObject>
    </>
  );
};

// ─── Main Component ───
const MindMap = ({ title, keyPoints = [] }) => {
  const { isDark } = useThemeStore();
  const { lang } = useLanguageStore();
  const isAr = lang === 'ar';

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [noteCount, setNoteCount] = useState(0);
  const reactFlowRef = useRef(null);
  const edgeUpdateOk = useRef(true);

  const nodeTypes = useMemo(() => ({ study: StudyNode }), []);
  const edgeTypes = useMemo(() => ({ deletable: DeletableEdge }), []);

  const deleteEdge = useCallback((edgeId) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, [setEdges]);

  const deleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  // Edge reconnection
  const onEdgeUpdateStart = useCallback(() => { edgeUpdateOk.current = false; }, []);
  const onEdgeUpdate = useCallback((oldEdge, newConn) => {
    edgeUpdateOk.current = true;
    setEdges((els) => updateEdge(oldEdge, newConn, els));
  }, [setEdges]);
  const onEdgeUpdateEnd = useCallback((_, edge) => {
    if (!edgeUpdateOk.current) setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    edgeUpdateOk.current = true;
  }, [setEdges]);

  // New connection by drag
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params, type: 'deletable', animated: true,
      data: { onDelete: deleteEdge },
      style: { strokeWidth: 2.5, stroke: isDark ? '#F43F5E' : '#E11D48' },
      markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#F43F5E' : '#E11D48' }
    }, eds)),
    [setEdges, isDark, deleteEdge]
  );

  const extractTitleAndBody = (fullText) => {
    if (typeof fullText !== 'string') fullText = JSON.stringify(fullText);
    const sep = fullText.match(/^([^:\u2013\u2014]{3,80})[:\u2013\u2014-]/);
    if (sep) return { title: sep[1].trim(), body: fullText.substring(sep[0].length).trim() };
    const words = fullText.split(/\s+/);
    if (words.length <= 6) return { title: fullText, body: '' };
    return { title: words.slice(0, 6).join(' ') + '\u2026', body: fullText };
  };

  const addStickyNote = useCallback(() => {
    const id = `note-${noteCount}`;
    setNoteCount(n => n + 1);
    const vp = reactFlowRef.current?.getViewport?.();
    const x = (vp ? -vp.x / (vp.zoom || 1) : 0) + 200 + Math.random() * 200;
    const y = (vp ? -vp.y / (vp.zoom || 1) : 0) + 100 + Math.random() * 200;
    setNodes((nds) => [...nds, {
      id, type: 'study',
      data: { shortTitle: isAr ? '\uD83D\uDCDD \u0645\u0644\u0627\u062D\u0638\u0629 \u062C\u062F\u064A\u062F\u0629' : '\uD83D\uDCDD New Note', color: '#F59E0B', onExpand: () => {}, onDeleteNode: deleteNode, height: 60 },
      position: { x, y },
      className: `w-[200px] shadow-lg border-l-[4px] !border-[#F59E0B] !rounded-xl p-1 ${isDark ? '!bg-[#F59E0B]/15 !text-white' : '!bg-amber-50 !text-gray-900'}`,
      style: { height: 60, display: 'flex', alignItems: 'center' }
    }]);
  }, [noteCount, setNodes, isDark, isAr]);

  useEffect(() => {
    if (!keyPoints || keyPoints.length === 0) return;
    const palette = ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F97316', '#EAB308', '#22C55E', '#06B6D4'];

    const rootNode = {
      id: 'root', type: 'study',
      data: { height: 120, label: title || 'Main Topic' },
      position: { x: 0, y: 0 },
      className: `w-[340px] shadow-[0_15px_50px_rgba(20,184,166,0.3)] border-[2px] !border-[#14B8A6] !rounded-2xl p-4 backdrop-blur-[24px] ${isDark ? '!bg-[#14B8A6]/10 !text-white' : '!bg-white/60 !text-gray-900'}`,
      style: { minHeight: 120 }
    };

    const half = Math.ceil(keyPoints.length / 2);
    const rN = [], rE = [], lN = [], lE = [];

    keyPoints.slice(0, half).forEach((pt, i) => {
      const id = `r-${i}`, parsed = extractTitleAndBody(pt), color = palette[i % palette.length];
      rN.push({ id, type: 'study', data: { height: defaultNodeHeight, shortTitle: parsed.title, color, onExpand: () => setSelectedPoint({ title: parsed.title, body: parsed.body || pt }), onDeleteNode: deleteNode }, position: { x: 0, y: 0 }, className: `w-[${nodeWidth}px] shadow-md border-l-[3px] !rounded-xl p-1 backdrop-blur-[16px] ${isDark ? '!bg-white/[0.04] !text-white' : '!bg-white/80 !text-gray-900'}`, style: { height: defaultNodeHeight, display: 'flex', alignItems: 'center', borderLeftColor: color } });
      rE.push({ id: `e-root-${id}`, source: 'root', sourceHandle: 'src-r', target: id, targetHandle: 'src-l', type: 'deletable', animated: true, data: { onDelete: deleteEdge }, style: { stroke: color, strokeWidth: 2.5, opacity: 0.7 }, markerEnd: { type: MarkerType.ArrowClosed, color } });
    });

    keyPoints.slice(half).forEach((pt, i) => {
      const id = `l-${i}`, parsed = extractTitleAndBody(pt), color = palette[(i + half) % palette.length];
      lN.push({ id, type: 'study', data: { height: defaultNodeHeight, shortTitle: parsed.title, color, onExpand: () => setSelectedPoint({ title: parsed.title, body: parsed.body || pt }), onDeleteNode: deleteNode }, position: { x: 0, y: 0 }, className: `w-[${nodeWidth}px] shadow-md border-r-[3px] !rounded-xl p-1 backdrop-blur-[16px] ${isDark ? '!bg-white/[0.04] !text-white' : '!bg-white/80 !text-gray-900'}`, style: { height: defaultNodeHeight, display: 'flex', alignItems: 'center', borderRightColor: color } });
      lE.push({ id: `e-root-${id}`, source: 'root', sourceHandle: 'src-l', target: id, targetHandle: 'src-r', type: 'deletable', animated: true, data: { onDelete: deleteEdge }, style: { stroke: color, strokeWidth: 2.5, opacity: 0.7 }, markerEnd: { type: MarkerType.ArrowClosed, color } });
    });

    const { nodes: rLaid } = getLayoutedElements([rootNode, ...rN], rE, 'LR');
    const { nodes: lLaid } = getLayoutedElements([rootNode, ...lN], lE, 'LR');
    const finalN = [];
    const rootPos = rLaid[0].position;
    rLaid.forEach(n => finalN.push(n));
    lLaid.forEach(n => { if (n.id !== 'root') { n.position.x = rootPos.x - (n.position.x - rootPos.x); finalN.push(n); } });
    setNodes(finalN);
    setEdges([...rE, ...lE]);
  }, [title, keyPoints, isDark, setNodes, setEdges, deleteEdge]);

  return (
    <div className={`w-full h-[600px] md:h-[800px] border rounded-[2rem] overflow-hidden ${isDark ? 'border-[var(--border-color)] bg-[#050510]/50' : 'border-gray-200 bg-gray-50/50'} pdf-section relative`}>
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#14B8A6]/5 blur-[120px] rounded-full -ml-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[120px] rounded-full -mr-32 -mb-32 pointer-events-none" />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeUpdateStart={onEdgeUpdateStart}
        onEdgeUpdateEnd={onEdgeUpdateEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode="loose"
        onInit={(inst) => {
          reactFlowRef.current = inst;
          setTimeout(() => inst.fitView({ padding: 0.15, includeHiddenNodes: true, duration: 800 }), 300);
        }}
        fitView
        fitViewOptions={{ padding: 0.15, includeHiddenNodes: true }}
        attributionPosition="bottom-right"
        minZoom={0.05}
        maxZoom={2}
        connectionLineStyle={{ strokeWidth: 2.5, stroke: isDark ? '#F43F5E' : '#E11D48' }}
        defaultEdgeOptions={{ type: 'deletable' }}
        snapToGrid
        snapGrid={[15, 15]}
        edgeUpdaterRadius={20}
      >
        <Background color={isDark ? '#222' : '#ddd'} gap={30} size={1.5} variant="dots" />
        <Controls position="bottom-left" />
        <MiniMap nodeStrokeWidth={3} position="bottom-right"
          style={{ background: isDark ? '#0a0a1a' : '#f8f8f8', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}
          maskColor={isDark ? 'rgba(0,0,0,0.7)' : 'rgba(200,200,200,0.5)'}
        />
        <Panel position="top-right" className="flex flex-col gap-2">
          <div className={`glass p-3 rounded-xl border border-[var(--glass-border)] text-xs shadow-lg max-w-[220px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className="font-bold text-[var(--text-primary)] mb-1.5 text-sm">{'\uD83E\uDDE0'} {isAr ? 'لوحة المذاكرة' : 'Study Board'}</div>
            <ul className="space-y-1 leading-relaxed">
              <li>{'\uD83D\uDD17'} {isAr ? 'اسحب من الدائرة لربط بطاقتين' : 'Drag from a dot to connect cards'}</li>
              <li>{'\u2194\uFE0F'} {isAr ? 'اسحب طرف السهم لنقله' : 'Drag arrow tip to move it'}</li>
              <li>{'\u274C'} {isAr ? 'اضغط × على الخط لحذفه' : 'Click × on a line to delete'}</li>
              <li>{'\uD83D\uDC41'} {isAr ? 'اضغط بطاقة لقراءة التفاصيل' : 'Click card to read details'}</li>
              <li>{'\u270B'} {isAr ? 'اسحب البطاقات لترتيبها' : 'Drag cards to rearrange'}</li>
            </ul>
          </div>
          <button onClick={addStickyNote}
            className="glass p-2.5 rounded-xl border border-[var(--glass-border)] text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 justify-center"
          >{'\uD83D\uDCDD'} {isAr ? 'إضافة ملاحظة' : 'Add Note'}</button>
        </Panel>
      </ReactFlow>

      {selectedPoint && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedPoint(null)}>
          <div className={`w-full max-w-lg p-8 rounded-3xl shadow-2xl border-2 border-[#14B8A6] ${isDark ? 'bg-[#0a0a1a]/95' : 'bg-white/95'}`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 border-b border-[var(--glass-border)] pb-4">
              <h3 className="text-lg font-black text-[#14B8A6] flex items-center gap-2">
                <span className="w-1 h-5 bg-[#14B8A6] rounded-full inline-block" />
                {selectedPoint.title}
              </h3>
              <button onClick={() => setSelectedPoint(null)} className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/30 text-red-400 flex items-center justify-center text-lg transition-colors">×</button>
            </div>
            <p className="text-[var(--text-secondary)] leading-loose text-base whitespace-pre-wrap" dir="auto">
              {selectedPoint.body || selectedPoint.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindMap;
