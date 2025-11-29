"use client"

import { useEffect, useMemo, useState } from "react"
import Header from "../components/Header"
import { memberAPI, relationshipAPI } from "../utils/api"

export default function TreeView({ onLogout }) {
  const [members, setMembers] = useState([])
  const [relationships, setRelationships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedGeneration, setSelectedGeneration] = useState("all")
  const [selectedMember, setSelectedMember] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const membersRes = await memberAPI.getAll()
      const relsRes = await relationshipAPI.getAll()
      setMembers(membersRes.data)
      setRelationships(relsRes.data)
      setError("")
    } catch (err) {
      setError("Failed to load family tree data")
    } finally {
      setLoading(false)
    }
  }

  const memberMap = useMemo(() => {
    const map = {}
    members.forEach((m) => {
      map[m._id] = m
    })
    return map
  }, [members])

  const normalizedRelationships = useMemo(
    () =>
      relationships.map((r) => ({
        _id: r._id,
        type: r.relationshipType || r.type,
        member1: typeof r.member1Id === "string" ? r.member1Id : r.member1Id?._id,
        member2: typeof r.member2Id === "string" ? r.member2Id : r.member2Id?._id,
      })),
    [relationships],
  )

  const { spouseMap, childrenMap } = useMemo(() => {
    const spouse = {}
    const children = {}

    normalizedRelationships.forEach((r) => {
      if (r.type === "spouse") {
        spouse[r.member1] = r.member2
        spouse[r.member2] = r.member1
      }
      if (r.type === "child") {
        const childId = r.member1
        const parentId = r.member2
        if (!children[parentId]) children[parentId] = []
        children[parentId].push(childId)
      }
      if (r.type === "parent") {
        const parentId = r.member1
        const childId = r.member2
        if (!children[parentId]) children[parentId] = []
        children[parentId].push(childId)
      }
    })

    return { spouseMap: spouse, childrenMap: children }
  }, [normalizedRelationships])

  const roots = useMemo(() => {
    const isChild = new Set()
    Object.values(childrenMap).forEach((arr) => arr.forEach((id) => isChild.add(id)))
    const rootsArr = members.filter((m) => !isChild.has(m._id))
    if (rootsArr.length === 0) {
      return members.filter((m) => m.generation === 0)
    }
    return rootsArr
  }, [members, childrenMap])

  const layout = useMemo(() => {
    const nodeSize = 150  // Reduced for mobile
    const levelGap = window.innerWidth < 640 ? 140 : 170  // Responsive vertical spacing
    const siblingGap = window.innerWidth < 640 ? 40 : 100  // Responsive horizontal spacing

    const coords = {}
    let currentX = 0

    const placeSubtree = (memberId, depth, visitedCouples) => {
      if (!memberMap[memberId]) return

      const spouseId = spouseMap[memberId]
      const coupleKey =
        spouseId && memberId < spouseId
          ? `${memberId}-${spouseId}`
          : spouseId
          ? `${spouseId}-${memberId}`
          : null

      if (coupleKey && visitedCouples.has(coupleKey)) return

      const childrenIds = new Set()
      Object.entries(childrenMap).forEach(([parentId, kids]) => {
        if (parentId === memberId || parentId === spouseId) {
          kids.forEach((c) => childrenIds.add(c))
        }
      })
      const childArr = Array.from(childrenIds)

      if (childArr.length === 0) {
        const xCenter = currentX
        const y = depth * levelGap
        coords[memberId] = { x: xCenter, y }
        if (spouseId && memberMap[spouseId]) {
          coords[spouseId] = { x: xCenter + nodeSize, y }
        }
        currentX += spouseId ? nodeSize * 2 + siblingGap : nodeSize + siblingGap
        if (coupleKey) visitedCouples.add(coupleKey)
      } else {
        const childXs = []
        childArr.forEach((childId) => {
          const before = currentX
          placeSubtree(childId, depth + 1, visitedCouples)
          const after = currentX
          childXs.push((before + after - siblingGap) / 2)
        })
        const minX = Math.min(...childXs)
        const maxX = Math.max(...childXs)
        const center = (minX + maxX) / 2
        const y = depth * levelGap
        coords[memberId] = { x: center, y }
        if (spouseId && memberMap[spouseId]) {
          coords[spouseId] = { x: center + nodeSize, y }
          if (coupleKey) visitedCouples.add(coupleKey)
        }
      }
    }

    const visitedCouples = new Set()
    roots.forEach((r) => {
      placeSubtree(r._id, r.generation || 0, visitedCouples)
      currentX += siblingGap
    })

    return { coords, nodeSize, levelGap }
  }, [members, roots, memberMap, spouseMap, childrenMap])

  const openMember = (m) => setSelectedMember(m)
  const closeMember = () => setSelectedMember(null)

  const getGenerationLabel = (gen) => {
    const labels = {
      0: "Generation 0 (Root)",
      1: "Generation 1 (Children)",
      2: "Generation 2 (Grandchildren)",
      3: "Generation 3 (Great-grandchildren)",
      "-1": "Generation -1 (Parents)",
      "-2": "Generation -2 (Grandparents)",
    }
    return labels[gen] || `Generation ${gen}`
  }

  const generations = useMemo(() => {
    const gens = Array.from(
      new Set(members.map((m) => (typeof m.generation === "number" ? m.generation : 0))),
    )
    return gens.sort((a, b) => a - b)
  }, [members])

  const filteredMembers =
    selectedGeneration === "all"
      ? members
      : members.filter((m) => m.generation === Number(selectedGeneration))

  const allPlaced = Object.values(layout.coords)
  const maxX = allPlaced.length ? Math.max(...allPlaced.map((c) => c.x)) : 0
  const minX = allPlaced.length ? Math.min(...allPlaced.map((c) => c.x)) : 0
  const maxY = allPlaced.length ? Math.max(...allPlaced.map((c) => c.y)) : 0

  const contentWidth = maxX - minX + (window.innerWidth < 640 ? 200 : 260)
  const svgWidth = Math.max(contentWidth, window.innerWidth < 640 ? 360 : 960)
  const svgHeight = Math.max(maxY + (window.innerWidth < 640 ? 250 : 300), window.innerWidth < 640 ? 360 : 420)

  const horizontalPadding = (svgWidth - contentWidth) / 2 - minX

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <Header onLogout={onLogout} />

      <main className="container py-4 sm:py-8 px-2 sm:px-0">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 flex-wrap">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 tracking-tight leading-tight">
              Family Tree
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 hidden sm:block">
              Visualize relationships across generations with an interactive tree.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 bg-slate-800 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg border border-slate-700 w-full sm:w-auto">
            <span className="text-xs font-medium text-slate-400 whitespace-nowrap">Filter:</span>
            <select
              value={selectedGeneration}
              onChange={(e) => setSelectedGeneration(e.target.value)}
              className="rounded-full border-none bg-slate-700 text-xs font-medium text-slate-200 px-2 sm:px-3 py-1 focus:ring-2 focus:ring-blue-400 outline-none w-full sm:w-auto text-left"
            >
              <option value="all">All</option>
              {generations.map((g) => (
                <option key={g} value={g}>
                  {getGenerationLabel(g)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 bg-red-900/30 border border-red-500/50 text-red-300 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-slate-400 text-base sm:text-lg">Loading family tree…</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-slate-400 text-base sm:text-lg">No family members added yet</p>
          </div>
        ) : (
          <div className="rounded-2xl sm:rounded-3xl bg-slate-800/50 shadow-2xl border border-slate-700 p-3 sm:p-6 overflow-hidden backdrop-blur max-w-full">
            <div className="w-full overflow-auto">
              <svg
                width="100%"
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="block mx-auto max-h-[60vh] sm:max-h-[70vh] w-full"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="nodeGradientPrimary" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                  <linearGradient id="nodeGradientSecondary" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0369a1" />
                    <stop offset="100%" stopColor="#0c4a6e" />
                  </linearGradient>
                  <linearGradient id="edgeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#64748b" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                  <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#00000044" />
                  </filter>
                </defs>

                <g transform={`translate(${horizontalPadding}, ${window.innerWidth < 640 ? 20 : 40})`}>
                  {/* Connectors */}
                  <g stroke="url(#edgeGradient)" strokeWidth="1.8 sm:stroke-width-2.2">
                    {/* Spouse connectors + heart - MOBILE FRIENDLY */}
                    {filteredMembers.map((m) => {
                      const spouseId = spouseMap[m._id]
                      if (!spouseId || !layout.coords[m._id] || !layout.coords[spouseId])
                        return null
                      if (m._id > spouseId) return null
                      const a = layout.coords[m._id]
                      const b = layout.coords[spouseId]
                      const y = a.y + (window.innerWidth < 640 ? 42 : 52)
                      const x1 = a.x + (window.innerWidth < 640 ? 38 : 48)
                      const x2 = b.x + (window.innerWidth < 640 ? 38 : 48)
                      const mid = (x1 + x2) / 2
                      const heartSize = window.innerWidth < 640 ? 10 : 13
                      const heartOffset = window.innerWidth < 640 ? 11 : 14
                      return (
                        <g key={`spouse-${m._id}-${spouseId}`}>
                          <line x1={x1} y1={y} x2={mid - heartOffset} y2={y} strokeLinecap="round"/>
                          <line x1={mid + heartOffset} y1={y} x2={x2} y2={y} strokeLinecap="round"/>
                          <circle cx={mid} cy={y} r={heartSize} fill="#f43f5e" filter="url(#softShadow)" />
                          <text
                            x={mid}
                            y={y + (window.innerWidth < 640 ? 3 : 4)}
                            textAnchor="middle"
                            fontSize={window.innerWidth < 640 ? "9" : "11"}
                            fill="white"
                            fontWeight="bold"
                          >
                            ♥
                          </text>
                        </g>
                      )
                    })}

                    {/* Parent -> child connectors - MOBILE FRIENDLY */}
                    {Object.entries(childrenMap).map(([parentId, kids]) => {
                      const parent = memberMap[parentId]
                      if (!parent || !layout.coords[parentId]) return null

                      const spouseId = spouseMap[parentId]
                      const parentPos = layout.coords[parentId]
                      const spousePos = spouseId ? layout.coords[spouseId] : null
                      const parentCenterX = spousePos
                        ? (parentPos.x + spousePos.x + (window.innerWidth < 640 ? 76 : 96)) / 2
                        : parentPos.x + (window.innerWidth < 640 ? 38 : 48)
                      const parentBottomY = parentPos.y + (window.innerWidth < 640 ? 80 : 100)

                      return kids.map((childId) => {
                        const childPos = layout.coords[childId]
                        if (!childPos) return null
                        const childTopY = childPos.y
                        const childCenterX = childPos.x + (window.innerWidth < 640 ? 38 : 48)

                        const midY = parentBottomY + (window.innerWidth < 640 ? 25 : 34)

                        return (
                          <g key={`line-${parentId}-${childId}`}>
                            <path
                              d={`M ${parentCenterX} ${parentBottomY}
                                L ${parentCenterX} ${midY}
                                L ${childCenterX} ${midY}
                                L ${childCenterX} ${childTopY}`}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                        )
                      })
                    })}
                  </g>

                  {/* Nodes - MOBILE FRIENDLY SIZING */}
                  {filteredMembers.map((m) => {
                    const pos = layout.coords[m._id]
                    if (!pos) return null

                    const isRoot = roots.some((r) => r._id === m._id)
                    const hasSpouse = spouseMap[m._id]

                    const borderColor = isRoot ? "#0ea5e9" : hasSpouse ? "#10b981" : "#0369a1"

                    const gradientId = isRoot ? "nodeGradientPrimary" : "nodeGradientSecondary"
                    const nodeR = window.innerWidth < 640 ? 38 : 48  // Smaller nodes on mobile
                    const nodeCX = window.innerWidth < 640 ? 38 : 48

                    return (
                      <g
                        key={m._id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        className="cursor-pointer transition-transform duration-150"
                        onClick={() => openMember(m)}
                      >
                        <circle
                          cx={nodeCX}
                          cy={nodeCX}
                          r={nodeR}
                          fill={`url(#${gradientId})`}
                          stroke={borderColor}
                          strokeWidth={window.innerWidth < 640 ? "2.5" : "3"}
                          filter="url(#softShadow)"
                        />
                        {m.photo && (
                          <clipPath id={`clip-${m._id}`}>
                            <circle cx={nodeCX} cy={nodeCX} r={window.innerWidth < 640 ? 33 : 43} />
                          </clipPath>
                        )}
                        {m.photo ? (
                          <image
                            href={m.photo}
                            x={window.innerWidth < 640 ? "5" : "5"}
                            y={window.innerWidth < 640 ? "5" : "5"}
                            width={window.innerWidth < 640 ? "66" : "86"}
                            height={window.innerWidth < 640 ? "66" : "86"}
                            clipPath={`url(#clip-${m._id})`}
                            preserveAspectRatio="xMidYMid slice"
                          />
                        ) : (
                          <text
                            x={nodeCX}
                            y={window.innerWidth < 640 ? "45" : "52"}
                            textAnchor="middle"
                            fontSize={window.innerWidth < 640 ? "20" : "26"}
                            fill="white"
                            fontWeight="700"
                          >
                            {m.name?.charAt(0)?.toUpperCase() || "?"}
                          </text>
                        )}
                        <foreignObject 
                          x={window.innerWidth < 640 ? "-35" : "-40"} 
                          y={window.innerWidth < 640 ? "82" : "102"} 
                          width={window.innerWidth < 640 ? "140" : "176"} 
                          height={window.innerWidth < 640 ? "50" : "62"}
                        >
                          <div className="text-center p-1">
                            <div className="text-xs sm:text-sm font-semibold text-slate-100 truncate px-1">
                              {m.name}
                            </div>
                          </div>
                        </foreignObject>
                      </g>
                    )
                  })}
                </g>
              </svg>
            </div>
          </div>
        )}

        {/* Statistics - MOBILE FRIENDLY */}
        <div className="mt-6 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="card bg-gradient-to-br from-blue-900 to-blue-800 text-white border-blue-500/30 p-3 sm:p-4 rounded-xl">
            <p className="text-xs opacity-90 font-medium tracking-wide uppercase">
              Total Members
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-1 sm:mt-2">{members.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-emerald-900 to-emerald-800 text-white border-emerald-500/30 p-3 sm:p-4 rounded-xl">
            <p className="text-xs opacity-90 font-medium tracking-wide uppercase">
              Relationships
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-1 sm:mt-2">{relationships.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-900 to-purple-800 text-white border-purple-500/30 p-3 sm:p-4 rounded-xl">
            <p className="text-xs opacity-90 font-medium tracking-wide uppercase">
              Generations
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-1 sm:mt-2">{generations.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-amber-900 to-orange-900 text-white border-amber-500/30 p-3 sm:p-4 rounded-xl">
            <p className="text-xs opacity-90 font-medium tracking-wide uppercase">
              Avg/Gen
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-1 sm:mt-2">
              {generations.length > 0 ? (members.length / generations.length).toFixed(1) : "0.0"}
            </p>
          </div>
        </div>
      </main>

      {/* Right-side detail drawer - FULL SCREEN ON MOBILE */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl border-l border-slate-700 z-40 transform transition-transform duration-300 ease-out overflow-hidden ${
          selectedMember ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedMember && (
          <div className="h-full flex flex-col">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-cyan-900/20 backdrop-blur">
              <h3 className="text-base sm:text-lg font-bold text-blue-100 truncate">{selectedMember.name}</h3>
              <button
                type="button"
                onClick={closeMember}
                className="text-slate-400 hover:text-slate-200 text-xl sm:text-2xl leading-none transition p-1 -m-1 rounded-full hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
              {/* Profile Section */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-blue-500/50 bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
                  {selectedMember.photo ? (
                    <img
                      src={selectedMember.photo}
                      alt={selectedMember.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      {selectedMember.name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-base sm:text-lg text-slate-100 truncate">{selectedMember.name}</p>
                  {selectedMember.gender && (
                    <p className="text-xs sm:text-sm text-slate-400 capitalize mt-0.5">
                      {selectedMember.gender}
                    </p>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="border-t border-slate-700 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Personal Information
                </p>

                {selectedMember.birthDate && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Birth Date</p>
                    <p className="text-slate-200 mt-1 text-sm">
                      {new Date(selectedMember.birthDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {selectedMember.deathDate && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Death Date</p>
                    <p className="text-slate-200 mt-1 text-sm">
                      {new Date(selectedMember.deathDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Professional Information */}
              {selectedMember.occupation && (
                <div className="border-t border-slate-700 pt-3 sm:pt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Occupation
                  </p>
                  <p className="text-slate-200 mt-2 text-sm">{selectedMember.occupation}</p>
                </div>
              )}

              {/* Contact Information */}
              <div className="border-t border-slate-700 pt-3 sm:pt-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Contact Information
                </p>

                {selectedMember.contactInfo?.email && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Email</p>
                    <p className="text-slate-300 text-sm break-all mt-1">
                      {selectedMember.contactInfo.email}
                    </p>
                  </div>
                )}

                {selectedMember.contactInfo?.phone && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Phone</p>
                    <p className="text-slate-300 text-sm mt-1">
                      {selectedMember.contactInfo.phone}
                    </p>
                  </div>
                )}

                {!selectedMember.contactInfo?.email &&
                  !selectedMember.contactInfo?.phone && (
                    <p className="text-xs text-slate-500 italic">
                      No contact information available
                    </p>
                  )}
              </div>

              {/* Biography */}
              {selectedMember.bio && (
                <div className="border-t border-slate-700 pt-3 sm:pt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Biography
                  </p>
                  <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                    {selectedMember.bio}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop to close drawer when clicking outside */}
      {selectedMember && (
        <button
          type="button"
          onClick={closeMember}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30"
        />
      )}
    </div>
  )
}
