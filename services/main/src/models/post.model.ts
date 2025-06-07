export interface PostsResponse {
    postId: string;
    content: string;
    comment_count: number;
    likes: number;
    liked: boolean;
    visibility: Visibility;
    user: {
        userId: string;
        username: string;
        avatar: string;
    }
    createdAt: Date;
    updatedAt: Date;
}

type Visibility = "FRIEND_ONLY" | "PUBLIC" | "PRIVATE"

export interface CommentResponse {
    content: string;
    commentId: string;
    user: {
        userId: string;
        username: string;
        avatar: string;
    }
}