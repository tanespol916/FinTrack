export interface Goal {
  id: number;
  userId: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGoalRequest {
  title: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string;
}

export interface UpdateGoalProgressRequest {
  currentAmount: number;
}

export interface GoalResponse {
  success: boolean;
  message: string;
  data?: {
    goal?: Goal;
    goals?: Goal[];
    account?: any;
    errors?: any[];
  };
}
