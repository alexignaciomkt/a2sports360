import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { MatchRepository } from "./match.repository";
import { MatchState, PrepareNextGameResult, PrepareEncounterFinishResult } from "./match.types";

export class MatchService {
  private repository: MatchRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new MatchRepository(supabase);
  }

  getWinsRequired(bestOf: number): number {
    return Math.ceil(bestOf / 2);
  }

  async getEncounterScore(encounterId: string): Promise<{ teamAWins: number; teamBWins: number }> {
    const encounter = await this.repository.getEncounter(encounterId);
    if (!encounter) throw new Error("Encounter not found");
    return { teamAWins: encounter.teamAWins, teamBWins: encounter.teamBWins };
  }

  async getCurrentGame(encounterId: string): Promise<MatchState | null> {
    const matches = await this.repository.getMatchesByEncounter(encounterId);
    if (matches.length === 0) return null;
    
    // Attempt to find one that is active or scheduled
    const active = matches.find(m => m.status === 'in_progress' || m.status === 'scheduled');
    if (active) return active;

    // Otherwise return the last finished one
    return matches[matches.length - 1];
  }

  async getCurrentGameNumber(encounterId: string): Promise<number> {
    const matches = await this.repository.getMatchesByEncounter(encounterId);
    if (matches.length === 0) return 0;
    return Math.max(...matches.map(m => m.gameNumber || 0));
  }

  async getNextGameNumber(encounterId: string): Promise<number> {
    const current = await this.getCurrentGameNumber(encounterId);
    return current + 1;
  }

  async isEncounterFinished(encounterId: string): Promise<boolean> {
    const encounter = await this.repository.getEncounter(encounterId);
    if (!encounter) return false;
    
    if (encounter.status === 'finished') return true;
    
    return encounter.teamAWins >= encounter.winsRequired || encounter.teamBWins >= encounter.winsRequired;
  }

  async getEncounterWinner(encounterId: string): Promise<string | null> {
    const encounter = await this.repository.getEncounter(encounterId);
    if (!encounter) return null;

    if (encounter.winnerTeamId) return encounter.winnerTeamId;

    if (encounter.teamAWins >= encounter.winsRequired) return encounter.teamAId;
    if (encounter.teamBWins >= encounter.winsRequired) return encounter.teamBId;

    return null;
  }

  async needsNextGame(encounterId: string): Promise<boolean> {
    const isFinished = await this.isEncounterFinished(encounterId);
    if (isFinished) return false;

    const matches = await this.repository.getMatchesByEncounter(encounterId);
    // If there is any match scheduled or in_progress, we don't need a new one
    const hasActiveGame = matches.some(m => m.status === 'scheduled' || m.status === 'in_progress');
    if (hasActiveGame) return false;

    return true;
  }

  async prepareNextGame(encounterId: string): Promise<PrepareNextGameResult> {
    const encounter = await this.repository.getEncounter(encounterId);
    if (!encounter) {
      return { canCreate: false, reason: 'Encounter not found' };
    }

    const needsNext = await this.needsNextGame(encounterId);
    if (!needsNext) {
      return { canCreate: false, reason: 'Encounter already finished or has active game' };
    }

    const nextGameNumber = await this.getNextGameNumber(encounterId);

    return {
      canCreate: true,
      payload: {
        encounterId: encounter.id,
        championshipId: encounter.championshipId,
        teamAId: encounter.teamAId,
        teamBId: encounter.teamBId,
        gameNumber: nextGameNumber,
        status: 'scheduled'
      }
    };
  }

  async prepareEncounterFinish(encounterId: string): Promise<PrepareEncounterFinishResult> {
    const encounter = await this.repository.getEncounter(encounterId);
    if (!encounter) {
      return { canFinish: false, reason: 'Encounter not found' };
    }

    if (encounter.status === 'finished') {
      return { canFinish: false, reason: 'Encounter already finished' };
    }

    const isFinished = encounter.teamAWins >= encounter.winsRequired || encounter.teamBWins >= encounter.winsRequired;
    if (!isFinished) {
      return { canFinish: false, reason: 'Wins required not reached' };
    }

    const winnerId = encounter.teamAWins >= encounter.winsRequired ? encounter.teamAId : encounter.teamBId;

    return {
      canFinish: true,
      payload: {
        encounterId: encounter.id,
        status: 'finished',
        winnerTeamId: winnerId,
        finishedAt: new Date().toISOString()
      }
    };
  }
}
