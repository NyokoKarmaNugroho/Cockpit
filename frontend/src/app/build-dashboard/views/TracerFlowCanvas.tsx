import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getSmoothStepPath,
  useEdgesState,
  useNodesState,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const SAMPLE = {
  sink: "55ZNPyNU8rPoin41G5mkYugi1nAvWC1YSaGh7zMW92Gi",
  srcA: "AF4jW3tHUQTgcPVPhpkgKbDr8fWeD87CG3J4dLXC1Qfn",
  srcB: "ARu4n5mFdZogZAravu7CcizaojWnS6oqka37gdLT5SZn",
} as const;

type AddressNodeData = { address: string; variant: "source" | "sink" };

function shortAddr(s: string) {
  if (s.length <= 16) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function AddressNode(props: NodeProps) {
  const data = props.data as AddressNodeData;
  const sink = data.variant === "sink";
  return (
    <div
      className={`w-[min(100vw-3rem,280px)] rounded-2xl border px-3 py-2.5 shadow-xl backdrop-blur-sm ${
        sink
          ? "border-sky-500/35 bg-zinc-950/95 ring-1 ring-sky-500/20"
          : "border-zinc-600/60 bg-zinc-900/95"
      }`}
    >
      {sink ? (
        <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-sky-500/50 !bg-sky-900" />
      ) : (
        <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-zinc-500 !bg-zinc-700" />
      )}
      <div className="flex flex-row items-start gap-2.5">
        <div
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600/30 to-indigo-600/20 text-[10px] font-bold text-violet-200 ring-1 ring-violet-500/30"
          title="Solana (demo)"
        >
          S
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] leading-[1.35] tracking-tight text-zinc-200">{shortAddr(data.address)}</p>
          <p className="mt-1 font-mono text-[10px] text-zinc-500">{data.address}</p>
        </div>
      </div>
      {!sink ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-200 transition hover:bg-sky-500/20"
          >
            <IconSearchTiny />
            Expand
          </button>
          <button
            type="button"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
            aria-label="Annotate node"
          >
            <IconPencilTiny />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function IconSearchTiny() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}

function IconPencilTiny() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CockpitStepEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const label = (data as { label?: string } | undefined)?.label ?? "";

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan max-w-[240px] rounded-lg border border-zinc-700/90 bg-zinc-950/98 px-2 py-1 font-mono text-[10px] leading-tight text-zinc-400 shadow-md"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = { cockpitAddress: AddressNode } as NodeTypes;
const edgeTypes = { cockpitStep: CockpitStepEdge };

const initialNodes: Node<AddressNodeData>[] = [
  {
    id: "n1",
    type: "cockpitAddress",
    position: { x: 0, y: 0 },
    data: { address: SAMPLE.srcA, variant: "source" },
  },
  {
    id: "n2",
    type: "cockpitAddress",
    position: { x: 0, y: 200 },
    data: { address: SAMPLE.srcB, variant: "source" },
  },
  {
    id: "n3",
    type: "cockpitAddress",
    position: { x: 420, y: 80 },
    data: { address: SAMPLE.sink, variant: "sink" },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1",
    source: "n1",
    target: "n3",
    type: "cockpitStep",
    animated: false,
    style: { stroke: "#52525b", strokeWidth: 1.25 },
    data: { label: "40 transfers · 2026-01-23 · 0.0020 SOL" },
  },
  {
    id: "e2",
    source: "n2",
    target: "n3",
    type: "cockpitStep",
    style: { stroke: "#52525b", strokeWidth: 1.25 },
    data: { label: "18 transfers · 2026-01-23 · 0.011 SOL" },
  },
];

function FlowShell() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-950">
      <SessionTabBar />
      <div className="relative min-h-0 flex-1">
        <CanvasToolbar />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.35, minZoom: 0.4, maxZoom: 1.25 }}
          minZoom={0.2}
          maxZoom={1.5}
          nodesConnectable={false}
          className="!bg-zinc-950 tracer-flow-canvas"
          defaultEdgeOptions={{ type: "cockpitStep" }}
        >
          <Background gap={22} size={1.2} color="#27272a" className="!bg-zinc-950" />
          <Controls
            className="!m-3 !overflow-hidden !rounded-xl !border !border-zinc-800 !bg-zinc-900/95 !shadow-lg [&_button]:!border-b-zinc-800 [&_button]:!bg-zinc-900 [&_button]:!fill-zinc-400 [&_button:hover]:!bg-zinc-800"
            showInteractive={false}
          />
          <MiniMap
            className="!m-3 !overflow-hidden !rounded-xl !border !border-zinc-800 !bg-zinc-900/90"
            nodeColor={() => "#3f3f46"}
            maskColor="rgb(24 24 27 / 0.75)"
            pannable
            zoomable
          />
        </ReactFlow>
      </div>
      <p className="shrink-0 border-t border-white/[0.06] bg-zinc-950 px-4 py-2 text-center text-[11px] text-zinc-500">
        Demo graph for layout review — not live chain data. Wire your indexer under Settings when ready.
      </p>
    </div>
  );
}

function SessionTabBar() {
  return (
    <div
      className="flex h-11 shrink-0 items-end gap-1 border-b border-zinc-800/80 bg-zinc-900/50 px-2"
      role="tablist"
      aria-label="Trace sessions"
    >
      <div
        className="flex h-9 max-w-[160px] cursor-default items-center gap-1.5 rounded-t-lg border border-b-0 border-zinc-700 bg-zinc-950 px-2.5 text-sm text-zinc-200"
        role="tab"
        aria-selected="true"
      >
        <span className="truncate">Untitled trace</span>
        <button type="button" className="rounded p-0.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300" aria-label="Close tab">
          <IconX />
        </button>
      </div>
      <button
        type="button"
        className="mb-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
        aria-label="New session"
      >
        <IconPlus />
      </button>
    </div>
  );
}

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function CanvasToolbar() {
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-3 z-10 flex flex-wrap items-start justify-between gap-2 px-3 sm:px-4">
      <div className="pointer-events-auto flex rounded-xl border border-zinc-800 bg-zinc-900/95 px-1 shadow-lg backdrop-blur">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
          title="Sketch mode"
        >
          <IconPencilTiny />
        </button>
      </div>
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <FilterChip label="Addresses" value="2 pinned" />
        <FilterChip label="Network" value="Solana" />
        <FilterChip label="Window" value="Any" />
      </div>
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-xl border border-zinc-800 bg-zinc-900/95 p-0.5 shadow-lg backdrop-blur">
        <ToolbarIconButton title="Refresh layout" label="Refresh">
          <IconRefresh />
        </ToolbarIconButton>
        <ToolbarIconButton title="Zoom in" label="Zoom in">
          <IconPlusSmall />
        </ToolbarIconButton>
        <ToolbarIconButton title="Zoom out" label="Zoom out">
          <IconMinus />
        </ToolbarIconButton>
        <ToolbarIconButton title="Fit view" label="Fit view">
          <IconMaximize />
        </ToolbarIconButton>
        <ToolbarIconButton title="Export PNG (soon)" label="Export" accent>
          <IconDownload />
        </ToolbarIconButton>
      </div>
    </div>
  );
}

function FilterChip({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      className="flex h-9 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/95 px-3 text-left text-xs text-zinc-300 shadow-md backdrop-blur hover:border-zinc-600"
    >
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-100">{value}</span>
      <span className="text-zinc-600">▾</span>
    </button>
  );
}

function ToolbarIconButton({
  title,
  label,
  children,
  accent,
}: {
  title: string;
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
        accent ? "text-sky-400 hover:bg-sky-500/10" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}

function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12a9 9 0 00-9-9 9.75 9.75 0 00-6.74 2.74L3 8" strokeLinecap="round" />
      <path d="M3 3v5h5M3 12a9 9 0 009 9 9.75 9.75 0 006.74-2.74L21 16" strokeLinecap="round" />
      <path d="M21 21v-5h-5" strokeLinecap="round" />
    </svg>
  );
}

function IconPlusSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconMinus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconMaximize() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TracerFlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowShell />
    </ReactFlowProvider>
  );
}
