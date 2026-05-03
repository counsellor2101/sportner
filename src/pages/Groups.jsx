import { useEffect, useMemo, useState } from "react"
import api from "../api/api"
import AppShell from "../components/AppShell"
import { texts } from "../i18n/texts"
import "../styles/groups.css"
import ConfirmModal from "../components/ConfirmModal"
import UserProfileModal from "../components/UserProfileModal"


export default function Groups() {

const [selectedUserId, setSelectedUserId] = useState(null)

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
      

const members = res.data?.data || []

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
  onClick={(e) => {
    e.stopPropagation()
    handleLeaveGroup(group)
  }}
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
        <div
  key={member.id}
  className="gdm-player-row"
  onClick={() => setSelectedUserId(member.id)}
>

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
  onClick={(e) => {
    e.stopPropagation()
    handleRemoveMember(group.id, member)
  }}
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
{selectedUserId && (
  <UserProfileModal
    userId={selectedUserId}
    onClose={() => setSelectedUserId(null)}
  />
)}



  </AppShell>
  )
}