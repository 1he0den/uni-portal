export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface Course {
  id: number;
  name: string;
  description: string;
  teacher_id: number;
  credits: number;
  created_at: string;
}

export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  enrolled_at: string;
}

export interface Task {
  id: number;
  name: string;
  description: string;
  deadline: string;
  course_id: number;
  max_points: number;
  file_url: string | null;
  created_at: string;
}

export interface Submission {
  id: number;
  task_id: number;
  student_id: number;
  file_url: string | null;
  submitted_at: string;
  is_late: boolean;
  grade: number | null;
  feedback: string | null;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  course_id: number;
  created_at: string;
}

export interface Material {
  id: number;
  title: string;
  file_url: string | null;
  course_id: number;
  uploaded_at: string;
}

