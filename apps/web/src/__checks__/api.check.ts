import { login, register, verifyEmail, createNote, updateNote, deleteNote, listNotes, getGraph, getNoteLinks, createGoal, addProgress, createTask, updateTask, listTasks, createTeam, inviteMember, listTeams, computeStreak, getActivityStats, getMe, getUser, joinTeam, addExplicitLink, mockRefresh, mockLogout } from "../lib/api/mock/api";
import { db } from "../lib/api/mock/data";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) { passed++; }
  else { failed++; console.error(`  FAIL: ${label}`); }
}

function throws(fn: () => any): boolean {
  try { fn(); return false; }
  catch { return true; }
}

console.log("\n--- Auth ---");
const email = "test@check.com";

assert(throws(() => login({ email, password: "x" })), "login with unknown email throws");

const reg = register({ email, name: "Tester", password: "pwd" });
assert(reg.requires_verification === true, "register returns requires_verification");
assert(reg.user.email === email, "register returns correct email");

const preVerify = login({ email, password: "pwd" });
assert(preVerify.requires_verification === true, "login before verify requires verification");

const verified = verifyEmail({ email, code: "123456" });
assert(verified.user.email === email, "verify succeeds");

const loggedIn = login({ email, password: "pwd" });
assert(loggedIn.user.name === "Tester", "login works after verify");
assert(!loggedIn.requires_verification, "no verification needed after verify");

console.log("\n--- Notes ---");
const userId = reg.user.id;
const note = createNote(userId, { title: "Test Note", content: "Hello [[world]]" });
assert(note.title === "Test Note", "createNote works");

const noteLinks = getNoteLinks(note.id);
assert(noteLinks.length === 1, "wikilink parsed: 1 link");
assert(noteLinks[0].target_title === "world", "wikilink title extracted");

const updated = updateNote(note.id, { content: "Updated [[world]] [[mars]]" });
assert(updated.content === "Updated [[world]] [[mars]]", "updateNote works");

const notes = listNotes(userId);
assert(notes.length === 1, "listNotes returns 1 note");

const graph = getGraph(userId);
assert(graph.nodes.length === 1, "graph node count");
assert(graph.edges.length >= 1, "graph has edges");

deleteNote(note.id);
assert(listNotes(userId).length === 0, "deleteNote removes note");

console.log("\n--- Goals + Tasks ---");
const goal = createGoal(userId, { title: "Run 10km", target: 10, unit: "km" });
assert(goal.current === 0, "goal starts at 0");

const progressed = addProgress(goal.id, 5);
assert(progressed.current === 5, "addProgress adds amount");

const task = createTask(userId, { title: "Run today", goal_id: goal.id });
assert(task.status === "todo", "task starts as todo");
assert(task.goal_id === goal.id, "task linked to goal");

const updatedTask = updateTask(task.id, { status: "done" });
assert(updatedTask.status === "done", "task marks as done");

const allTasks = listTasks(userId);
assert(allTasks.length === 1, "listTasks returns 1 task");

console.log("\n--- Teams ---");
const team = createTeam(userId, { name: "Test Team" });
assert(team.name === "Test Team", "createTeam");
assert(team.slug === "test-team", "slug generated");

const member = inviteMember(team.id, { email: "sofia@flowstate.app", role: "mentor" });
assert(member.role === "mentor", "invite sets role");

const teams = listTeams(userId);
assert(teams.length === 1, "listTeams returns team");

const fetchedUser = getUser(userId);
assert(fetchedUser !== null, "getUser returns user");
assert(fetchedUser!.email === email, "getUser correct email");

const me = getMe(userId);
assert(me !== null && me.email === email, "getMe returns current user");

mockLogout();
assert(true, "mockLogout no-op");

const refreshed = mockRefresh("old-token");
assert(refreshed.access_token.startsWith("mock-access-"), "refresh returns tokens");

const team2 = createTeam("user-marcus", { name: "Public Team" });
const joined = joinTeam(team2.id, userId, "any-token");
assert(joined.role === "member", "joinTeam works");

const extraNote = createNote(userId, { title: "Linked Note", content: "test" });
const link = addExplicitLink(extraNote.id, "Test Note");
assert(link !== null && link.target_title === "Test Note", "addExplicitLink works");

console.log("\n--- Activity ---");
assert(computeStreak() >= 0, "streak computed");
const stats = getActivityStats(userId);
assert(typeof stats.tasksDone === "number", "activity stats valid");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
