const FFA_TEAM = 4;
const OTHER_TEAM = 3;

export default function canAttack(selfTeam: number, otherTeam: number): boolean {
	if (0 === selfTeam || 0 === otherTeam) return true;
	if (selfTeam === FFA_TEAM || otherTeam === FFA_TEAM) return true;
	return OTHER_TEAM === selfTeam ? OTHER_TEAM === otherTeam : selfTeam != otherTeam;
}
