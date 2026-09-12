import type { EventRepository, WorkerRepository } from '../domain/repositories';
import type { MatchResult, WorkforceEvent } from '../domain/types';

export interface ReadinessSignal {
  label: string;
  evidence: string;
}

export function getReadinessSignals(workers: WorkerRepository): ReadinessSignal[] {
  const worker = workers.getDemoWorker();
  const certifications = workers.getCertifications(worker.workerId);
  const experience = workers.getExperience(worker.workerId);
  const skills = workers.getSkills(worker.workerId);
  const certificationSignal = (keyword: string) =>
    certifications.find((item) => item.certification_name.toLocaleLowerCase().includes(keyword))?.certification_name;
  const skillSignal = (category: string) => skills.find((item) => item.skill_category === category)?.skill_name;
  const experienceSignal = (keyword: string) =>
    experience.find((item) => item.experience_type.includes(keyword))?.role_title;

  return [
    { label: 'Commercial driving readiness', evidence: certificationSignal('commercial driver') ?? worker.licenses[0] },
    { label: 'Construction safety', evidence: certificationSignal('osha') ?? skillSignal('safety') ?? 'Safety evidence available' },
    { label: 'Construction support', evidence: experienceSignal('construction') ?? skillSignal('construction') ?? 'Construction evidence available' },
    { label: 'Field safety', evidence: skillSignal('safety') ?? 'Safety evidence available' },
    { label: 'Transportation operations', evidence: experienceSignal('transit') ?? skillSignal('transportation') ?? 'Operations evidence available' },
    { label: 'MC3 training', evidence: experienceSignal('pre_apprenticeship') ?? worker.trainingSummary },
  ];
}

export function getUpcomingDates(matches: MatchResult[], events: EventRepository): Array<{ label: string; date: string; kind: string }> {
  const matchDates = matches
    .filter((match) => /^\d{4}-\d{2}-\d{2}$/.test(match.target.deadlineOrDate))
    .map((match) => ({ label: match.target.title, date: match.target.deadlineOrDate, kind: match.target.isProjectDemand ? 'Project date' : 'Deadline / next date' }));
  const eventDates = events
    .list()
    .slice(0, 3)
    .map((event) => ({ label: event.name, date: event.start_date, kind: 'Event' }));
  return [...matchDates, ...eventDates].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
}

export function getFeaturedEvents(events: EventRepository): WorkforceEvent[] {
  return events.list().filter((event) => event.status !== 'past_monitor_annual').slice(0, 4);
}
