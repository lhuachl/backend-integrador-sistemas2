import type { ApiClient } from "./types";
import { mockClient } from "./mock";
import { realClient } from "./real";

const USE_REAL = process.env.NEXT_PUBLIC_USE_REAL_API === "true";

export const client: ApiClient = USE_REAL ? realClient : mockClient;

export type { ApiClient, AuthResponse, LoginBody, RegisterBody, GoogleBody, VerifyBody, NoteCreateBody, NoteUpdateBody, GoalCreateBody, GoalUpdateBody, TaskCreateBody, TaskUpdateBody, TeamCreateBody, InviteBody, ActivityStats } from "./types";
export type { User, Team, TeamMember, Note, NoteLink, Goal, Task, GraphData, Notification } from "../mock/data";
