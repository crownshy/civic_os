export interface WikiPollReport {
	comments: CommentReportData[];
	groups: GroupReportData[];
	participants: ParticipantReportData[];
}

export interface CommentReportData {
	tid: number;
	text: string;
	overall_votes: VoteCounts;
	group_votes: GroupVoteCounts[];
	group_informed_consensus: number | null;
	divisiveness: number | null;
}

export interface VoteCounts {
	agrees: number;
	disagrees: number;
	passes: number;
}

export interface GroupVoteCounts {
	group_id: number;
	agrees: number;
	disagrees: number;
	passes: number;
}

export interface GroupReportData {
	group_id: number;
	representative_comments: RepresentativeComment[];
	members: number[];
	total_members: number;
}

export interface RepresentativeComment {
	tid: number;
	text: string;
}

export interface ParticipantReportData {
	pid: number;
	group_id: number | null;
	pca_position: PcaPosition | null;
}

export interface PcaPosition {
	x: number;
	y: number;
}
