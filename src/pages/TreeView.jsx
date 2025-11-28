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
    const nodeSize = 150
    const levelGap = 170
    const siblingGap = 70

    const coords = {}
    let currentX = 0

    const placeSubtree = (memberId, depth, visitedCouples) => {
      if (!memberMap[memberId]) return

      const spouseId = spouseMap[memberId]
      const coupleKey =
        spouseId && memberId < spouseId ? `${memberId}-${spouseId}` : spouseId ? `${spouseId}-${memberId}` : null

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
    const gens = Array.from(new Set(members.map((m) => (typeof m.generation === "number" ? m.generation : 0))))
    return gens.sort((a, b) => a - b)
  }, [members])

  const filteredMembers =
    selectedGeneration === "all" ? members : members.filter((m) => m.generation === Number(selectedGeneration))

  const allPlaced = Object.values(layout.coords)
  const maxX = allPlaced.length ? Math.max(...allPlaced.map((c) => c.x)) : 0
  const minX = allPlaced.length ? Math.min(...allPlaced.map((c) => c.x)) : 0
  const maxY = allPlaced.length ? Math.max(...allPlaced.map((c) => c.y)) : 0

  const contentWidth = maxX - minX + 260
  const svgWidth = Math.max(contentWidth, 960)
  const svgHeight = Math.max(maxY + 300, 420)

  const horizontalPadding = (svgWidth - contentWidth) / 2 - minX

  return (
    <div className="min-h-screen bg-black">
      <Header onLogout={onLogout} />

      <main className="container py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Family Tree</h1>
            <p className="text-sm text-slate-600">
              Visualize relationships across generations with an interactive tree.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/80 backdrop-blur px-3 py-2 rounded-full shadow-sm border border-slate-200">
            <span className="text-xs font-medium text-slate-600">Filter by generation</span>
            <select
              value={selectedGeneration}
              onChange={(e) => setSelectedGeneration(e.target.value)}
              className="rounded-full border-none bg-slate-100 text-xs font-medium text-slate-800 px-3 py-1 focus:ring-2 focus:ring-indigo-400"
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

        {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

        {loading ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">Loading family tree…</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">No family members added yet</p>
          </div>
        ) : (
          <div className="rounded-3xl bg-[#3d3d3d] shadow-xl border border-slate-200 p-6 overflow-auto">
            <div className="min-w-full">
              <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="block mx-auto">
                <defs>
                  <linearGradient id="nodeGradientPrimary" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#EEF2FF" />
                    <stop offset="100%" stopColor="#DBEAFE" />
                  </linearGradient>
                  <linearGradient id="nodeGradientSecondary" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F5F3FF" />
                    <stop offset="100%" stopColor="#E0F2FE" />
                  </linearGradient>
                  <linearGradient id="edgeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#CBD5F5" />
                    <stop offset="100%" stopColor="#E5E7EB" />
                  </linearGradient>
                  <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#00000022" />
                  </filter>
                </defs>

                <g transform={`translate(${horizontalPadding}, 40)`}>
                  {/* Connectors */}
                  <g stroke="url(#edgeGradient)" strokeWidth="2.2">
                    {/* Spouse connectors + heart */}
                    {filteredMembers.map((m) => {
                      const spouseId = spouseMap[m._id]
                      if (!spouseId || !layout.coords[m._id] || !layout.coords[spouseId]) return null
                      if (m._id > spouseId) return null
                      const a = layout.coords[m._id]
                      const b = layout.coords[spouseId]
                      const y = a.y + 52
                      const x1 = a.x + 48
                      const x2 = b.x + 48
                      const mid = (x1 + x2) / 2
                      return (
                        <g key={`spouse-${m._id}-${spouseId}`}>
                          <line x1={x1} y1={y} x2={mid - 14} y2={y} />
                          <line x1={mid + 14} y1={y} x2={x2} y2={y} />
                          <circle cx={mid} cy={y} r="13" fill="#F97373" filter="url(#softShadow)" />
                          <text x={mid} y={y + 4} textAnchor="middle" fontSize="11" fill="white">
                            ♥
                          </text>
                        </g>
                      )
                    })}

                    {/* Parent -> child connectors */}
                    {Object.entries(childrenMap).map(([parentId, kids]) => {
                      const parent = memberMap[parentId]
                      if (!parent || !layout.coords[parentId]) return null

                      const spouseId = spouseMap[parentId]
                      const parentPos = layout.coords[parentId]
                      const spousePos = spouseId ? layout.coords[spouseId] : null
                      const parentCenterX = spousePos ? (parentPos.x + spousePos.x + 96) / 2 : parentPos.x + 48
                      const parentBottomY = parentPos.y + 100

                      return kids.map((childId) => {
                        const childPos = layout.coords[childId]
                        if (!childPos) return null
                        const childTopY = childPos.y
                        const childCenterX = childPos.x + 48

                        const midY = parentBottomY + 34

                        return (
                          <g key={`line-${parentId}-${childId}`}>
                            <path
                              d={`M ${parentCenterX} ${parentBottomY}
                                  L ${parentCenterX} ${midY}
                                  L ${childCenterX} ${midY}
                                  L ${childCenterX} ${childTopY}`}
                              fill="none"
                              strokeLinecap="round"
                            />
                          </g>
                        )
                      })
                    })}
                  </g>

                  {/* Nodes */}
                  {filteredMembers.map((m) => {
                    const pos = layout.coords[m._id]
                    if (!pos) return null

                    const isRoot = roots.some((r) => r._id === m._id)
                    const hasSpouse = spouseMap[m._id]

                    const borderColor = isRoot ? "#4F46E5" : hasSpouse ? "#10B981" : "#6366F1"

                    const gradientId = isRoot ? "nodeGradientPrimary" : "nodeGradientSecondary"

                    return (
                      <g
                        key={m._id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        className="cursor-pointer transition-transform duration-150"
                        onClick={() => openMember(m)}
                      >
                        <circle
                          cx="48"
                          cy="48"
                          r="48"
                          fill={`url(#${gradientId})`}
                          stroke={borderColor}
                          strokeWidth="3"
                          filter="url(#softShadow)"
                        />
                        {m.photo && (
                          <clipPath id={`clip-${m._id}`}>
                            <circle cx="48" cy="48" r="43" />
                          </clipPath>
                        )}
                        {m.photo ? (
                          <image
                            href={m.photo}
                            x="5"
                            y="5"
                            width="86"
                            height="86"
                            clipPath={`url(#clip-${m._id})`}
                            preserveAspectRatio="xMidYMid slice"
                          />
                        ) : (
                          <text x="48" y="52" textAnchor="middle" fontSize="26" fill="#312E81" fontWeight="700">
                            {m.name?.charAt(0)?.toUpperCase() || "?"}
                          </text>
                        )}
                        <foreignObject x="-40" y="102" width="176" height="62">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-slate-100 truncate">{m.name}</div>
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

        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg p-4 rounded-lg">
            <p className="text-xs opacity-90 font-medium tracking-wide uppercase">Total Members</p>
            <p className="text-3xl font-extrabold mt-1">{members.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg p-4 rounded-lg">
            <p className="text-xs opacity-90 font-medium tracking-wide uppercase">Total Relationships</p>
            <p className="text-3xl font-extrabold mt-1">{relationships.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg p-4 rounded-lg">
            <p className="text-xs opacity-90 font-medium tracking-wide uppercase">Generations</p>
            <p className="text-3xl font-extrabold mt-1">{generations.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg p-4 rounded-lg">
            <p className="text-xs opacity-90 font-medium tracking-wide uppercase">Avg Members / Gen</p>
            <p className="text-3xl font-extrabold mt-1">
              {generations.length > 0 ? (members.length / generations.length).toFixed(1) : "0.0"}
            </p>
          </div>
        </div>
      </main>

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white/95 backdrop-blur shadow-2xl border-l border-slate-200 z-40 transform transition-transform duration-300 ease-out ${
          selectedMember ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedMember && (
          <div className="h-full flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-semibold text-slate-900">{selectedMember.name}</h3>
              <button
                type="button"
                onClick={closeMember}
                className="text-slate-500 hover:text-slate-800 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-4 border-indigo-500 bg-gradient-to-br from-indigo-50 to-sky-50 flex items-center justify-center overflow-hidden shadow-md flex-shrink-0">
                  {selectedMember.photo ? (
                    <img
                      src={selectedMember.photo || "/placeholder.svg"}
                      alt={selectedMember.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold text-indigo-700">
                      {selectedMember.name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedMember.name}</p>
                  {selectedMember.gender && (
                    <p className="text-sm text-slate-600 capitalize">{selectedMember.gender}</p>
                  )}
                  {selectedMember.birthDate && (
                    <p className="text-xs text-slate-500">
                      {new Date(selectedMember.birthDate).getFullYear()}{" "}
                      {selectedMember.deathDate ? `- ${new Date(selectedMember.deathDate).getFullYear()}` : "- Present"}
                    </p>
                  )}
                  {typeof selectedMember.generation === "number" && (
                    <p className="text-xs text-indigo-600 mt-1 font-medium">
                      {getGenerationLabel(selectedMember.generation)}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                {selectedMember.occupation && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Occupation</p>
                    <p className="text-slate-900">{selectedMember.occupation}</p>
                  </div>
                )}

                {selectedMember.email && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                    <p className="text-slate-900 text-sm break-all">{selectedMember.email}</p>
                  </div>
                )}

                {selectedMember.phone && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Phone</p>
                    <p className="text-slate-900">{selectedMember.phone}</p>
                  </div>
                )}

                {selectedMember.biography && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Biography</p>
                    <p className="text-slate-900 text-sm">{selectedMember.biography}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
