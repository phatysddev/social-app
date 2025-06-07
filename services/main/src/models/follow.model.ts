export interface GetOwnFollowerResponse {
    username: string;
    avatar: string | null;
    follower_count: number;
    following_count: number;
    follower: FollowResponse[];
    following: FollowResponse[];
}

export interface FollowResponse {
    username: string;
    avatar: string | null;
}