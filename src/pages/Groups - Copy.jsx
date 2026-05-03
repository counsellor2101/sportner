import { useEffect, useMemo, useState } from "react"
import api from "../api/api"
import AppShell from "../components/AppShell"
import { texts } from "../i18n/texts"
import "../styles/groups.css"
import ConfirmModal from "../components/ConfirmModal"

const ROLE_ORDER = {
  owner: 0,
  admin: 1,
  member: 2
}

function sortMembers(list = []) {
  return [...list].sort((a, b) => {
    const roleDiff =
      (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99)

    if (roleDiff !== 0) return roleDiff

    return String(a.nickname || "").localeCompare(String(b.nickname || ""), "bg", {
      sensitivity: "base"
    })
  })
}

function getAvatar(member) {
  if (member.avatar) return member.avatar
  if (member.avatar_url) return member.avatar_url
  return ""
}

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("") || "?"
}

function GroupDetails({
  group,
  members,
  loading,
  actionLoading,
  onClose,
  onLeave,
  onDeleteGroup,
  onRemoveMember,
  t
}) {
  const isOwner = group?.role === "owner"



  return (
    <div className="groups-backdrop" onClick={onClose}>
      <div
        className="groups-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="groups-sheet-handle" />

        <div className="groups-sheet-header">
          <div>
            <div className="groups-sheet-title">{group?.name}</div>
            <div className="groups-sheet-subtitle">
              {group?.role === "owner" ? t.group_role_owner : t.group_role_member}
            </div>
          </div>

          <button
            className="groups-close-btn"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="groups-members-section">
          <div className="groups-section-title">
            {t.group_members}
          </div>

          {loading ? (
            <div className="groups-empty-state">{t.loading}</div>
          ) : members.length === 0 ? (
            <div className="groups-empty-state">{t.no_members}</div>
          ) : (
            <div className="groups-members-list">
              {members.map((member) => {
                const avatar = getAvatar(member)
                const canRemove =
                  isOwner &&
                  member.role !== "owner" &&
                  Number(member.id) !== Number(group.owner_id)

                return (
                  <div className="groups-member-row" key={member.id}>
                    <div className="groups-member-left">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={member.nickname}
                          className="groups-member-avatar"
                        />
                      ) : (
                        <div className="groups-member-avatar groups-member-placeholder">
                          {getInitials(member.nickname)}
                        </div>
                      )}

                      <div className="groups-member-meta">
                        <div className="groups-member-name">
                          {member.nickname}
                        </div>

                        <div
                          className={`groups-role-badge role-${member.role || "member"}`}
                        >
                          {member.role === "owner"
                            ? t.group_role_owner
                            : member.role === "admin"
                            ? t.group_role_admin
                            : t.group_role_member}
                        </div>
                      </div>
                    </div>

                    {canRemove && (
                      <button
                        type="button"
                        className="groups-danger-btn"
                        disabled={actionLoading}
                        onClick={() => onRemoveMember(member)}
                      >
                        {t.remove}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="groups-actions">
          {isOwner ? (
            <button
              type="button"
              className="groups-danger-wide-btn"
              disabled={actionLoading}
              onClick={onDeleteGroup}
            >
              {t.delete_group}
            </button>
          ) : (
            <button
              type="button"
              className="groups-secondary-wide-btn"
              disabled={actionLoading}
              onClick={onLeave}
            >
              {t.leave_group}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Groups() {

const [confirmState, setConfirmState] = useState(null)
// { type: "leave" | "delete" | "remove", group, member }

  const lang = localStorage.getItem("lang") || "bg"
  const t = texts[lang] || texts.bg

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

const [expandedGroupId, setExpandedGroupId] = useState(null)

  const [membersByGroup, setMembersByGroup] = useState({})
  const [membersLoading, setMembersLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  async function loadGroups() {
    try {
      const res = await api.get("/me/groups")
      setGroups(res.data?.data || [])
    } catch (e) {
      console.log("groups load error", e)
    } finally {
      setLoading(false)
    }
  }

async function invite(groupId){
  try{
    const res = await api.post(`/groups/${groupId}/invite`)
    const link = res.data.invite_url

    if (navigator.share) {
      await navigator.share({
        title: "Sportner Group",
        text: t.invite_text || "Join my group on Sportner",
        url: link
      })
      return
    }

    await navigator.clipboard.writeText(link)
    alert(t.invite_copied || "Invite link copied")

  }catch(e){
    console.log("invite error", e)
  }
}

  useEffect(() => {
    loadGroups()

    function handleUpdate() {
      loadGroups()
    }

    window.addEventListener("groupsUpdated", handleUpdate)

    return () => {
      window.removeEventListener("groupsUpdated", handleUpdate)
    }
  }, [])

  async function loadMembers(groupId, force = false) {
    if (!force && membersByGroup[groupId]) return

    try {
      setMembersLoading(true)

      const res = await api.get(`/groups/${groupId}/members`)
      const members = sortMembers(res.data?.data || [])

      setMembersByGroup(prev => ({
        ...prev,
        [groupId]: members
      }))
    } catch (e) {
      console.log("group members load error", e)
    } finally {
      setMembersLoading(false)
    }
  }

async function openGroup(group) {

  if (expandedGroupId === group.id) {
    setExpandedGroupId(null)
    return
  }

  setExpandedGroupId(group.id)
  await loadMembers(group.id)
}



  async function createGroup() {
    const name = prompt(t.group_name_prompt || "Group name")

    if (!name?.trim()) return

    try {
      await api.post("/groups", { name: name.trim() })
      await loadGroups()
      window.dispatchEvent(new Event("groupsUpdated"))
    } catch (e) {
      console.log("create group error", e)
    }
  }

  async function handleLeaveGroup(group) {
  if (!group || actionLoading) return

setConfirmState({
  type: "leave",
  group
})
return

  try {
    setActionLoading(true)

    await api.delete(`/groups/${group.id}/leave`)

    // махаме от UI
    setGroups(prev => prev.filter(g => g.id !== group.id))

    // чистим members кеша
    setMembersByGroup(prev => {
      const copy = { ...prev }
      delete copy[group.id]
      return copy
    })

    // ако е отворена – затвори
    setExpandedGroupId(null)

    window.dispatchEvent(new Event("groupsUpdated"))

  } catch (e) {
    console.log("leave group error", e)
  } finally {
    setActionLoading(false)
  }
}

  async function handleDeleteGroup(group) {
  if (!group) return

setConfirmState({
  type: "delete",
  group
})
return

  try {
    await api.delete(`/groups/${group.id}`)

    // махаме от UI
    setGroups(prev => prev.filter(g => g.id !== group.id))

    // чистим кеша за members
    setMembersByGroup(prev => {
      const copy = { ...prev }
      delete copy[group.id]
      return copy
    })

    window.dispatchEvent(new Event("groupsUpdated"))

  } catch (e) {
    console.log("delete group error", e)
  }
}

  async function handleRemoveMember(groupId, member) {
  if (actionLoading) return

setConfirmState({
  type: "remove",
  groupId,
  member
})
return

  try {
    setActionLoading(true)

    await api.delete(`/groups/${groupId}/members/${member.id}`)

    setMembersByGroup(prev => ({
      ...prev,
      [groupId]: sortMembers(
        (prev[groupId] || []).filter(m => Number(m.id) !== Number(member.id))
      )
    }))
  } catch (e) {
    console.log("remove member error", e)
  } finally {
    setActionLoading(false)
  }
}












  return (
    <AppShell pageClass="app-layout">

  <div className="screen">

    <div className="discover-panel">
      <div className="discover-title">
        {t.my_groups || "My Groups"}
      </div>
    </div>

    <div className="timeline">
  <div className="timeline-inner">

    <div className="groups-page">

      <div className="groups-header">

        <button
          type="button"
          className="cgm-create-btn"
          onClick={createGroup}
        >
          {t.create_group || "Create group"}
        </button>

      </div>

        {loading ? (
          <div className="groups-empty-state">{t.loading || "Loading..."}</div>
        ) : groups.length === 0 ? (
          <div className="groups-empty-card">
            <div className="groups-empty-title">
              {t.no_groups_yet || "No groups yet"}
            </div>
            <div className="groups-empty-text">
              {t.create_first_group || "Create your first group to get started"}
            </div>
          </div>
        ) : (
          <div className="groups-list">
            {groups.map((group) => (
              <div className="groups-card" key={group.id}>
                



  <div className="groups-card-main">
    <div className="groups-card-name">{group.name}</div>

    <div
      className={`groups-role-badge role-${group.role || "member"}`}
    >
      {group.role === "owner"
        ? `👑 ${t.group_role_owner || "Owner"}`
        : group.role === "admin"
        ? t.group_role_admin || "Admin"
        : t.group_role_member || "Member"}
    </div>
  </div>

  {group.role === "owner" ? (

  <div className="groups-actions-right">

    <button
      className="gdm-invite-btn groupinvite"
      onClick={() => invite(group.id)}
    >
      🔗 {t.invite_players || "Invite Players"}
    </button>

    <button
      className="gdm-invite-btn groupdelete"
      onClick={() => handleDeleteGroup(group)}
    >
      {t.delete_group}
    </button>

  </div>

) : (

  <div className="groups-actions-right">

    <button
      className="gdm-invite-btn groupdelete"
      onClick={() => handleLeaveGroup(group)}
    >
      {t.leave_group}
    </button>

  </div>

)}



<button
  type="button"
  className="gdm-join-btn"
  onClick={() => openGroup(group)}
>
  {t.open || "Open"}
</button>

{expandedGroupId === group.id && (
  <div className="gdm-players-list">

    {(membersByGroup[group.id] || []).map(member => {

      const isOwner = member.role === "owner"

      return (
        <div key={member.id} className="gdm-player-row">

          <div className="gdm-player-avatar">
            {member.avatar ? (
              <img src={member.avatar} alt={member.nickname} />
            ) : (
              <span>
                {member.nickname.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="gdm-player-info">

            <div className="player-row1">

              <span className="gdm-player-name">
                {member.nickname}
              </span>

              {isOwner && (
                <span className="player-owner">👑</span>
              )}



            </div>

            <div className="player-row2">
              {t.group_role || "Role"}:{" "}
              {member.role}
            </div>

          </div>

          {/* 🔥 REMOVE BUTTON */}
          {group.role === "owner" && member.role !== "owner" && (
            <button
              className="gdm-invite-btn groupdelete"
              onClick={() => handleRemoveMember(group.id, member)}
            >
              {t.remove}
            </button>
          )}

        </div>
      )
    })}

  </div>
)}           </div>
            ))}
          </div>
        )}

        
      </div> {/* groups-page */}

    </div> {/* timeline-inner */}
  </div> {/* timeline */}

    </div> {/* screen */}


<ConfirmModal
  open={!!confirmState}
  title={
    confirmState?.type === "delete"
      ? (t.confirm_delete_group || "Delete group")
      : confirmState?.type === "leave"
      ? (t.confirm_leave_group || "Leave group")
      : `${t.confirm_remove_member || "Remove member"}: ${confirmState?.member?.nickname}`
  }
  message={
    confirmState?.type === "delete"
      ? (t.confirm_delete_group || "Delete group")
      : confirmState?.type === "leave"
      ? (t.confirm_leave_group || "Leave group")
      : `${t.confirm_remove_member || "Remove member"}: ${confirmState?.member?.nickname}`
  }
  confirmText={
    confirmState?.type === "delete"
      ? (t.delete_group || "Delete")
      : confirmState?.type === "leave"
      ? (t.leave_group || "Leave")
      : (t.remove || "Remove")
  }
  cancelText={t.confirm_back || "Cancel"}
  type={confirmState?.type === "delete" ? "danger" : "default"}
  onCancel={() => setConfirmState(null)}
  onConfirm={async () => {
    if (!confirmState) return

    try {
      setActionLoading(true)

      if (confirmState.type === "delete") {
        const group = confirmState.group

        await api.delete(`/groups/${group.id}`)

        setGroups(prev => prev.filter(g => g.id !== group.id))

        setMembersByGroup(prev => {
          const copy = { ...prev }
          delete copy[group.id]
          return copy
        })

        window.dispatchEvent(new Event("groupsUpdated"))
      }

      if (confirmState.type === "leave") {
        const group = confirmState.group

        await api.delete(`/groups/${group.id}/leave`)

        setGroups(prev => prev.filter(g => g.id !== group.id))

        setMembersByGroup(prev => {
          const copy = { ...prev }
          delete copy[group.id]
          return copy
        })

        setExpandedGroupId(null)

        window.dispatchEvent(new Event("groupsUpdated"))
      }

      if (confirmState.type === "remove") {
        const { groupId, member } = confirmState

        await api.delete(`/groups/${groupId}/members/${member.id}`)

        setMembersByGroup(prev => ({
          ...prev,
          [groupId]: (prev[groupId] || []).filter(
            m => Number(m.id) !== Number(member.id)
          )
        }))
      }

    } catch (e) {
      console.log("confirm action error", e)
    } finally {
      setActionLoading(false)
      setConfirmState(null)
    }
  }}
/>


  </AppShell>
  )
}