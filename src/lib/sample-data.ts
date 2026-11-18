import { StudyMaterial } from '@/types';

export interface SampleDocumentItem {
  id: string;
  title: string;
  subject: string;
  tags: string[];
  excerpt: string;
  sourceText: string;
  materials: StudyMaterial;
}

export const SAMPLE_DOCUMENTS: Record<string, SampleDocumentItem> = {
  medicalCaseStudy: {
    id: 'sample-medical-stemi',
    title: 'Emergency Triage: Acute STEMI & Reperfusion Protocols',
    subject: 'Medicine',
    tags: ['Cardiology', 'Emergency Care', 'Triage Protocol'],
    excerpt: 'Clinical pathway for ST-elevation myocardial infarction triage, primary PCI timeframes, antiplatelet administration, and fibrinolytic backup protocols.',
    sourceText: `CLINICAL PRACTICE GUIDELINE: EMERGENCY MANAGEMENT OF ACUTE ST-ELEVATION MYOCARDIAL INFARCTION (STEMI)

1. Initial Assessment & Diagnostic Criteria
Upon arrival at the emergency department or first medical contact (FMC), patients presenting with symptoms indicative of myocardial ischemia (substernal chest pressure, radiation to the left jaw/arm, diaphoresis, dyspnea) must receive a diagnostic 12-lead electrocardiogram (ECG) within 10 minutes of arrival.
Diagnostic criteria for STEMI require new or presumed new ST-segment elevation measured at the J-point in at least two contiguous leads:
- Leads V2–V3: >= 2.0 mm (0.2 mV) in men >= 40 years, >= 2.5 mm in men < 40 years, or >= 1.5 mm in women of any age.
- All other contiguous anatomical leads (II, III, aVF for inferior; I, aVL, V5, V6 for lateral): >= 1.0 mm (0.1 mV).
- New Left Bundle Branch Block (LBBB) with concordant ST changes (Sgarbossa criteria) should be treated as a STEMI equivalent.

2. Immediate Pharmacotherapy
Immediately upon confirmation of STEMI, initiate foundational medical therapy unless absolute contraindications exist:
- Aspirin: 162 mg to 325 mg non-enteric chewable tablet administered immediately.
- P2Y12 Receptor Inhibitor: Loading dose of Ticagrelor (180 mg) or Prasugrel (60 mg) preferred over Clopidogrel (600 mg).
- Anticoagulation: Unfractionated heparin (UFH) bolus (60 IU/kg, maximum 4000 IU) followed by infusion (12 IU/kg/h), or Bivalirudin.
- Nitroglycerin: Sublingual 0.4 mg every 5 minutes (max 3 doses) for ischemic pain, strictly contraindicated if systolic BP < 90 mmHg, severe bradycardia, or recent PDE-5 inhibitor use (sildenafil within 24h, tadalafil within 48h), or in suspected right ventricular infarction.
- Supplemental Oxygen: Administer only if arterial oxygen saturation (SaO2) is below 90% or in respiratory distress.

3. Reperfusion Strategy Selection
The primary objective is rapid mechanical or pharmacological restoration of coronary blood flow:
- Primary Percutaneous Coronary Intervention (PCI): The treatment of choice when achievable within guideline timeframes.
  * Door-to-Balloon Time: Goal is <= 90 minutes when presenting directly to a PCI-capable center.
  * Transfer FMC-to-Balloon Time: When presenting to a non-PCI center, if transfer to a PCI facility can achieve balloon inflation within <= 120 minutes of FMC, transfer immediately.
- Fibrinolytic Therapy (Pharmacological Reperfusion):
  * Indication: If expected FMC-to-PCI transfer delay exceeds 120 minutes and patient presents within 12 hours of symptom onset.
  * Door-to-Needle Time: Administration of weight-adjusted Tenecteplase (TNK-tPA) IV bolus within <= 30 minutes of arrival.
  * Post-Fibrinolysis Transfer: Immediate transfer to a PCI center for routine coronary angiography within 2 to 24 hours (pharmacoinvasive strategy), or emergent rescue PCI if ST resolution < 50% at 60-90 minutes.

4. Post-Reperfusion Complications & Monitoring
Continuous telemetry monitoring in the coronary care unit (CCU) is mandatory for at least 24 hours:
- Ventricular Arrhythmias: Sustained ventricular tachycardia (VT) or ventricular fibrillation (VF) within 48 hours requires defibrillation and beta-blocker titration; lidocaine or amiodarone if recurrent.
- Cardiogenic Shock: Characterized by persistent hypotension (SBP < 90 mmHg), cardiac index < 2.2 L/min/m2, and elevated pulmonary wedge pressure (> 18 mmHg). Requires immediate mechanical circulatory support (Impella, IABP) and emergent revascularization.
- Mechanical Complications: New holosystolic murmur with sudden hemodynamic collapse indicates acute papillary muscle rupture (severe mitral regurgitation) or ventricular septal defect (VSD), necessitating urgent echocardiography and emergency surgical repair.`,
    materials: {
      mermaid_code: `flowchart TD
    A[Suspected Acute STEMI Patient] --> B[12-Lead ECG within 10 min]
    B --> C{ST Elevation in >=2 contiguous leads?}
    C -- No --> D[Evaluate NSTEMI / Troponin Pathway]
    C -- Yes --> E[Immediate Dual Antiplatelet & Heparin]
    E --> F{PCI facility achievable in <=120 min?}
    F -- Yes --> G[Primary PCI: Door-to-Balloon <=90 min]
    F -- No --> H[Fibrinolysis: TNK-tPA Door-to-Needle <=30 min]
    H --> I{>=50% ST Resolution at 60-90 min?}
    I -- Yes --> J[Pharmacoinvasive Angiography 2-24 hrs]
    I -- No --> K[Emergent Rescue PCI]
    G --> L[CCU Telemetry: Monitor Arrhythmias & Shock]
    J --> L
    K --> L`,
      flashcards: [
        {
          question: 'What is the target timeframe for obtaining a 12-lead ECG in suspected STEMI?',
          answer: 'Within 10 minutes of arrival or First Medical Contact (FMC).',
          sourceExcerpt: 'Upon arrival at the emergency department or first medical contact (FMC), patients presenting with symptoms indicative of myocardial ischemia must receive a diagnostic 12-lead electrocardiogram (ECG) within 10 minutes of arrival.'
        },
        {
          question: 'What is the maximum acceptable FMC-to-Balloon delay before switching to fibrinolytic therapy?',
          answer: '120 minutes. If transfer to a PCI facility cannot achieve balloon inflation within 120 minutes of FMC, fibrinolysis is indicated.',
          sourceExcerpt: 'If expected FMC-to-PCI transfer delay exceeds 120 minutes and patient presents within 12 hours of symptom onset, fibrinolytic therapy is indicated.'
        },
        {
          question: 'What are the door-to-balloon and door-to-needle guideline benchmark times?',
          answer: 'Door-to-Balloon time <= 90 minutes (for primary PCI); Door-to-Needle time <= 30 minutes (for fibrinolytic bolus).',
          sourceExcerpt: 'Door-to-Balloon Time: Goal is <= 90 minutes when presenting directly to a PCI-capable center... Door-to-Needle Time: Administration of weight-adjusted Tenecteplase within <= 30 minutes of arrival.'
        },
        {
          question: 'When is sublingual nitroglycerin strictly contraindicated in acute myocardial infarction?',
          answer: 'Systolic BP < 90 mmHg, severe bradycardia, right ventricular infarction, or recent PDE-5 inhibitor use (sildenafil within 24h, tadalafil within 48h).',
          sourceExcerpt: 'Nitroglycerin: Sublingual 0.4 mg every 5 minutes... strictly contraindicated if systolic BP < 90 mmHg, severe bradycardia, or recent PDE-5 inhibitor use (sildenafil within 24h, tadalafil within 48h), or in suspected right ventricular infarction.'
        },
        {
          question: 'What clinical sign suggests an acute mechanical complication (papillary muscle rupture or VSD)?',
          answer: 'A new harsh holosystolic murmur accompanied by sudden hemodynamic collapse.',
          sourceExcerpt: 'New holosystolic murmur with sudden hemodynamic collapse indicates acute papillary muscle rupture (severe mitral regurgitation) or ventricular septal defect (VSD), necessitating urgent echocardiography.'
        }
      ],
      quiz: [
        {
          question: 'A 56-year-old male arrives at a community hospital without a catheterization lab. Transfer time to the nearest PCI center will result in an estimated FMC-to-balloon time of 150 minutes. Which reperfusion approach is correct?',
          options: [
            'Wait for transfer because Primary PCI is always superior regardless of delay',
            'Administer weight-adjusted Tenecteplase (TNK-tPA) within 30 minutes, then arrange immediate transfer',
            'Administer therapeutic heparin alone and perform elective outpatient angiography',
            'Perform urgent coronary artery bypass graft (CABG) surgery on-site'
          ],
          correct_option: 1,
          explanation: 'When expected FMC-to-balloon time exceeds 120 minutes and symptom onset is <12 hours, fibrinolytic therapy with TNK-tPA (door-to-needle <= 30 min) followed by transfer for pharmacoinvasive evaluation is the standard of care.',
          sourceExcerpt: 'If expected FMC-to-PCI transfer delay exceeds 120 minutes and patient presents within 12 hours of symptom onset, administer weight-adjusted Tenecteplase within <= 30 minutes of arrival.'
        },
        {
          question: 'Under what circumstances should supplemental oxygen be routinely administered during acute STEMI triage?',
          options: [
            'To every patient regardless of saturation to maximize myocardial oxygenation',
            'Only when arterial oxygen saturation (SaO2) falls below 90% or in respiratory distress',
            'Only if the patient presents with anterior wall infarction',
            'Never, because oxygen causes coronary hyperoxia vasoconstriction in all patients'
          ],
          correct_option: 1,
          explanation: 'Routine oxygen in normoxemic patients causes hyperoxic coronary vasoconstriction and increased oxidative stress. Guidelines recommend oxygen only when SaO2 is <90% or the patient exhibits respiratory distress.',
          sourceExcerpt: 'Supplemental Oxygen: Administer only if arterial oxygen saturation (SaO2) is below 90% or in respiratory distress.'
        },
        {
          question: 'Which threshold defines successful reperfusion 60 to 90 minutes following fibrinolytic administration?',
          options: [
            'Complete resolution of chest pain without ECG changes',
            'At least 50% reduction in the initial ST-segment elevation on repeat ECG',
            'Normalization of serum troponin levels within 1 hour',
            'Increase in heart rate above 100 bpm'
          ],
          correct_option: 1,
          explanation: 'Successful reperfusion post-fibrinolysis is defined as >= 50% resolution of ST-segment elevation at 60–90 minutes. Failure to achieve this indicates the need for emergent rescue PCI.',
          sourceExcerpt: 'Post-Fibrinolysis Transfer: Immediate transfer to a PCI center for routine coronary angiography within 2 to 24 hours, or emergent rescue PCI if ST resolution < 50% at 60-90 minutes.'
        },
        {
          question: 'A patient with an inferior STEMI develops severe hypotension after receiving sublingual nitroglycerin. What is the most probable cause?',
          options: [
            'Anaphylactic reaction to the nitrate preservative',
            'Concomitant right ventricular infarction dependent on preload',
            'Severe aortic regurgitation',
            'Acute respiratory distress syndrome'
          ],
          correct_option: 1,
          explanation: 'Inferior STEMIs often involve the right coronary artery and right ventricle. The right ventricle is highly preload-dependent; nitrates cause venodilation and profound hypotension.',
          sourceExcerpt: 'Nitroglycerin... strictly contraindicated if systolic BP < 90 mmHg, severe bradycardia, or recent PDE-5 inhibitor use, or in suspected right ventricular infarction.'
        }
      ]
    }
  },

  corporateLawBrief: {
    id: 'sample-law-caremark',
    title: 'Corporate Governance: Delaware Fiduciary Duties & Caremark Oversight',
    subject: 'Corporate Law',
    tags: ['Delaware Law', 'Caremark', 'Business Judgment Rule', 'M&A'],
    excerpt: 'Analysis of director fiduciary duties under DGCL: Duty of Care vs. Loyalty, the Business Judgment Rule presumption, and Caremark liability for compliance failure.',
    sourceText: `LEGAL ANALYSIS BRIEF: DIRECTORS' FIDUCIARY DUTIES UNDER DELAWARE GENERAL CORPORATION LAW (DGCL)

1. The Core Fiduciary Duties: Care vs. Loyalty
Under Delaware General Corporation Law, directors owe unyielding fiduciary duties to the corporation and its stockholders. These duties are divided into two primary obligations:
- Duty of Care: Requires directors to act on an informed basis, with the diligence of an ordinarily prudent person in a similar position. Delaware courts evaluate breach of care under a standard of gross negligence. Under DGCL Section 102(b)(7), corporations may include exculpatory charter provisions shielding directors from monetary liability for monetary damages arising solely from breaches of the duty of care.
- Duty of Loyalty: Mandates that directors act in good faith and in the honest belief that their actions are in the best interests of the corporation. The duty of loyalty prohibits self-dealing, misappropriation of corporate opportunities, and bad faith. Crucially, violations of the duty of loyalty cannot be exculpated under DGCL Section 102(b)(7), nor can they be indemnified under DGCL Section 145.

2. Standards of Judicial Review
Delaware courts evaluate board decisions using three distinct tiers of judicial review:
- The Business Judgment Rule (BJR): The default presumption that in making a business decision, the directors acted on an informed basis, in good faith, and in the honest belief that the action taken was in the best interests of the company. A plaintiff challenging a board decision under the BJR must prove gross negligence, waste, or conflict of interest to rebut the presumption.
- Enhanced Scrutiny: Applies in specific contexts where inherent conflicts of interest exist without reaching self-dealing:
  * Revlon Duties: Triggered when a board undertakes a transaction that will result in a change of control or break-up of the company. The board's sole fiduciary objective becomes maximizing immediate stockholder value (securing the highest transaction price reasonably available).
  * Unocal Standard: Applies when a board adopts defensive measures against a hostile takeover. Directors must demonstrate reasonable grounds for believing a danger to corporate policy existed, and that defensive measures were proportionate to the threat posed.
- Entire Fairness: The highest and most rigorous standard, applied when the plaintiff rebuts the BJR or where a controlling stockholder engages in a self-interested conflict transaction. The burden shifts to defendants to prove both fair dealing (process and timing) and fair price.

3. The Caremark Doctrine: Failure of Board Oversight
Established in In re Caremark International Inc. Derivative Litigation (1996) and refined by the Delaware Supreme Court in Stone v. Ritter (2006) and Marchand v. Barnhill (2019):
- Nature of Claim: Caremark liability is rooted in a violation of the duty of loyalty (bad faith), not mere negligence.
- Two Prongs for Liability:
  * Prong One (Information Systems): The directors utterly failed to implement any system or controls of reporting or information.
  * Prong Two (Red Flags): Having implemented such a system or controls, the directors consciously failed to monitor or oversee its operations, thus disabling themselves from being informed of risks or problems requiring their attention.
- Mission-Critical Compliance: In Marchand v. Barnhill, the Delaware Supreme Court held that boards must make a good-faith effort to implement board-level compliance monitoring systems for central, mission-critical operational risks (e.g., food safety for an ice cream manufacturer). Delegating compliance exclusively to executive management without regular board-level reporting agendas fails the Caremark mandate.`,
    materials: {
      mermaid_code: `flowchart TD
    A[Board Decision Challenged] --> B{Controlling Stockholder or Self-Dealing?}
    B -- Yes --> C[Entire Fairness Standard: Fair Dealing & Fair Price]
    B -- No --> D{Change of Control or Defensive Action?}
    D -- Change of Control --> E[Revlon Scrutiny: Maximize Immediate Stockholder Value]
    D -- Defensive Measure --> F[Unocal Standard: Reasonable Threat & Proportional Response]
    D -- Standard Business Action --> G[Business Judgment Rule Presumption]
    G --> H{Plaintiff Rebuts via Bad Faith or Waste?}
    H -- No --> I[Case Dismissed Under BJR]
    H -- Yes --> C
    A --> J{Allegation of Oversight Failure?}
    J -- Caremark Claim --> K{Did Board Utterly Fail System or Ignore Red Flags?}
    K -- Yes: Bad Faith --> L[Duty of Loyalty Breach: Non-Exculpable Liability]
    K -- No --> I`,
      flashcards: [
        {
          question: 'What standard of conduct establishes a breach of the fiduciary duty of care under Delaware law?',
          answer: 'Gross negligence in failing to act on an informed basis.',
          sourceExcerpt: 'Delaware courts evaluate breach of care under a standard of gross negligence. Under DGCL Section 102(b)(7), corporations may include exculpatory charter provisions shielding directors.'
        },
        {
          question: 'Why are duty of loyalty breaches far more dangerous for corporate directors than duty of care breaches?',
          answer: 'Breaches of loyalty (including bad faith and Caremark oversight failures) cannot be exculpated under DGCL 102(b)(7) or indemnified under DGCL 145.',
          sourceExcerpt: 'Crucially, violations of the duty of loyalty cannot be exculpated under DGCL Section 102(b)(7), nor can they be indemnified under DGCL Section 145.'
        },
        {
          question: 'What are the two prongs required to prove a Caremark oversight violation?',
          answer: '1) Utter failure to implement any reporting/information systems, or 2) Conscious failure to monitor/oversee implemented systems after receiving red flags.',
          sourceExcerpt: 'Prong One: The directors utterly failed to implement any system or controls... Prong Two: Having implemented such a system, the directors consciously failed to monitor or oversee its operations (ignoring red flags).'
        },
        {
          question: 'When are directors subject to Revlon duties, and what is their sole objective?',
          answer: 'When undertaking a transaction resulting in a change of control; the sole objective is securing the highest price reasonably available for stockholders.',
          sourceExcerpt: 'Revlon Duties: Triggered when a board undertakes a transaction that will result in a change of control or break-up of the company. The board sole fiduciary objective becomes maximizing immediate stockholder value.'
        },
        {
          question: 'What constitutes "Mission-Critical" compliance under Marchand v. Barnhill?',
          answer: 'Risks essential to the company\'s core operations (e.g., food safety) requiring board-level reporting systems, not just management discretion.',
          sourceExcerpt: 'In Marchand v. Barnhill, the Delaware Supreme Court held that boards must make a good-faith effort to implement board-level compliance monitoring systems for central, mission-critical operational risks.'
        }
      ],
      quiz: [
        {
          question: 'Under Delaware General Corporation Law, which of the following liabilities may a corporation exculpate in its certificate of incorporation under Section 102(b)(7)?',
          options: [
            'Monetary damages for breaches of the fiduciary duty of loyalty',
            'Monetary damages for gross negligence under the duty of care',
            'Acts or omissions not in good faith or involving intentional misconduct',
            'Transactions from which a director derived an improper personal benefit'
          ],
          correct_option: 1,
          explanation: 'Section 102(b)(7) permits corporate charters to exculpate directors solely for monetary damages arising from breaches of the duty of care (gross negligence). Loyalty, bad faith, and self-dealing are explicitly excluded.',
          sourceExcerpt: 'Under DGCL Section 102(b)(7), corporations may include exculpatory charter provisions shielding directors from monetary liability for monetary damages arising solely from breaches of the duty of care.'
        },
        {
          question: 'In a change-of-control all-cash merger, which legal standard governs the board of directors\' conduct?',
          options: [
            'The Business Judgment Rule without scrutiny',
            'Entire Fairness review by default',
            'Revlon enhanced scrutiny requiring directors to seek the highest transaction value reasonably obtainable',
            'Unocal defensive proportionality review'
          ],
          correct_option: 2,
          explanation: 'When a board undertakes a transaction that produces a change of control (such as selling to an all-cash acquirer), Revlon applies, focusing scrutiny on whether directors acted reasonably to obtain the highest transaction value.',
          sourceExcerpt: 'Revlon Duties: Triggered when a board undertakes a transaction that will result in a change of control... The board\'s sole fiduciary objective becomes maximizing immediate stockholder value.'
        },
        {
          question: 'Why did the Delaware Supreme Court find a viable Caremark claim against the directors of Blue Bell Creameries in Marchand v. Barnhill?',
          options: [
            'Directors received millions in illicit kickbacks from dairy suppliers',
            'Directors failed to implement any board-level reporting system or agenda specifically dedicated to food safety compliance',
            'Directors failed to sell the company at the highest price during an acquisition',
            'The company did not hire an independent audit firm for tax filings'
          ],
          correct_option: 1,
          explanation: 'Despite food safety being the single mission-critical risk for an ice cream manufacturer, the board had no committee, regular reporting schedule, or protocols dedicated to monitoring food safety compliance.',
          sourceExcerpt: 'In Marchand v. Barnhill, the Delaware Supreme Court held that boards must make a good-faith effort to implement board-level compliance monitoring systems for central, mission-critical operational risks... Delegating compliance exclusively to executive management without regular board-level reporting agendas fails the Caremark mandate.'
        },
        {
          question: 'When a controlling stockholder stands on both sides of a buyout transaction with the subsidiary, what standard of judicial review applies by default?',
          options: [
            'Entire Fairness, requiring proof of fair dealing and fair price',
            'Business Judgment Rule, unless gross negligence is proven',
            'Caremark review for bad faith',
            'Revlon review with no defense'
          ],
          correct_option: 0,
          explanation: 'Where a controlling stockholder engages in a self-interested transaction, Entire Fairness is the default standard, shifting the burden of proof to defendants to demonstrate both procedural fairness and substantive fair price.',
          sourceExcerpt: 'Entire Fairness: The highest and most rigorous standard, applied when the plaintiff rebuts the BJR or where a controlling stockholder engages in a self-interested conflict transaction. The burden shifts to defendants to prove both fair dealing and fair price.'
        }
      ]
    }
  },

  systemsArchitecture: {
    id: 'sample-tech-raft',
    title: 'Distributed Consensus: Raft Protocol & State Machine Replication',
    subject: 'Computer Science',
    tags: ['Distributed Systems', 'Consensus Algorithms', 'Raft', 'Fault Tolerance'],
    excerpt: 'Deep-dive into Raft consensus: Leader election, heartbeat timeouts, quorum log replication, and safety invariants for fault-tolerant state machines.',
    sourceText: `TECHNICAL SPECIFICATION: RAFT DISTRIBUTED CONSENSUS PROTOCOL

1. Introduction & State Machine Replication
Raft is a distributed consensus algorithm designed for understandability, equivalency to Multi-Paxos in fault tolerance and performance, and formal safety verification. In a replicated state machine architecture, identical deterministic state machines run across a cluster of N nodes (typically 3, 5, or 7). The cluster maintains availability and consensus as long as a strict quorum of nodes is functional:
- Quorum Size: Formally defined as floor(N/2) + 1. For a 5-node cluster, quorum is 3 nodes, tolerating up to 2 concurrent node failures.
- Server States: At any given instant, each node operates in one of three discrete states:
  * Follower: Passive state; responds only to incoming RPCs from leaders and candidates.
  * Candidate: Active state entered when an election timeout fires without receiving leader heartbeats; solicits votes from peers.
  * Leader: Coordinates all client interactions, manages log entry appending, and commands log replication across followers.

2. Leader Election & Randomized Timers
Time in Raft is divided into arbitrary terms of logical increments (Term Numbers: integers starting at 0). Terms act as logical clocks allowing nodes to detect obsolete information:
- Election Timeout: The duration a follower waits without receiving an AppendEntries heartbeat before initiating an election. Crucially, election timeouts are randomized (typically between 150 ms and 300 ms) to disperse candidate transitions and avoid split-vote deadlocks.
- Election Procedure:
  1. Follower timeout elapses -> transitions to Candidate state.
  2. Increments its currentTerm number.
  3. Votes for itself and broadcasts RequestVote RPCs to all peers in parallel.
  4. Candidate remains in state until one of three events:
     a) Wins the election by receiving affirmative votes from a majority of nodes in the cluster.
     b) Receives an AppendEntries RPC from a legitimate leader whose term is >= candidate's currentTerm (reverting back to Follower).
     c) Election timeout expires without winner (initiating a new election with new randomized timeout).

3. Log Replication & Commit Rules
Once a leader is established, it serves all client write requests:
- Log Structure: Each log entry comprises three fields: the state machine command, an integer index representing slot position, and the term number when the entry was received.
- Replication Protocol:
  1. Leader appends client command to its own log as an uncommitted entry.
  2. Leader issues AppendEntries RPCs carrying the new entry along with the index and term of the immediately preceding entry (prevLogIndex, prevLogTerm).
  3. Log Matching Invariant: If two distinct logs contain an entry with identical index and term, they are guaranteed to contain identical commands in that entry, and their logs are identical up to that index.
  4. Commit Threshold: An entry is considered committed once it has been replicated across a majority (quorum) of cluster nodes.
  5. State Machine Application: The leader advances its commitIndex, applies the entry to its local state machine, returns the result to the client, and notifies followers in subsequent AppendEntries RPCs to apply the entry.

4. Raft Safety Properties & Election Restriction
To prevent uncommitted or conflicting log entries from corrupting state machines:
- Leader Completeness: If a log entry is committed in a given term, that entry will be present in the logs of the leaders for all higher-numbered terms.
- Election Restriction Rule: Voters must reject candidates whose logs are less up-to-date than their own. A candidate log is more up-to-date if:
  * Its last log entry has a higher term number; OR
  * If terms are identical, the candidate log contains a greater total number of entries (longer index).
- Leader Append-Only Invariant: A leader never overwrites or truncates its own log entries; it only appends new entries. Followers overwrite conflicting uncommitted entries with the leader's ground-truth log.`,
    materials: {
      mermaid_code: `stateDiagram-v2
    [*] --> Follower
    Follower --> Candidate: Election Timeout (No Heartbeat)
    Candidate --> Candidate: Split Vote / Timeout
    Candidate --> Leader: Receives Majority Quorum Votes
    Candidate --> Follower: Discovers Leader with >= Term
    Leader --> Follower: Discovers Higher Term Node
    state Leader {
      [*] --> AppendEntriesBroadcast
      AppendEntriesBroadcast --> QuorumReplication
      QuorumReplication --> CommitToStateMachine
    }`,
      flashcards: [
        {
          question: 'What is the minimum quorum size required for a Raft cluster consisting of 5 nodes?',
          answer: '3 nodes (floor(5/2) + 1). This allows the cluster to tolerate up to 2 concurrent failures.',
          sourceExcerpt: 'Quorum Size: Formally defined as floor(N/2) + 1. For a 5-node cluster, quorum is 3 nodes, tolerating up to 2 concurrent node failures.'
        },
        {
          question: 'Why does Raft randomize election timeouts (typically 150ms to 300ms)?',
          answer: 'To prevent simultaneous candidate transitions, ensuring one node times out first and avoiding split-vote ties.',
          sourceExcerpt: 'Crucially, election timeouts are randomized (typically between 150 ms and 300 ms) to disperse candidate transitions and avoid split-vote deadlocks.'
        },
        {
          question: 'When is a log entry formally considered "committed" in the Raft protocol?',
          answer: 'When it has been safely stored and replicated across a majority (quorum) of nodes in the cluster.',
          sourceExcerpt: 'Commit Threshold: An entry is considered committed once it has been replicated across a majority (quorum) of cluster nodes.'
        },
        {
          question: 'What is the Election Restriction rule that guarantees the Leader Completeness property?',
          answer: 'Followers reject votes for any candidate whose log is less up-to-date (lower term, or shorter log if terms match).',
          sourceExcerpt: 'Election Restriction Rule: Voters must reject candidates whose logs are less up-to-date than their own. A candidate log is more up-to-date if its last entry has a higher term or longer index.'
        },
        {
          question: 'What happens when a Raft leader discovers a peer transmitting an RPC with a higher term number?',
          answer: 'The leader immediately steps down and transitions back to the Follower state.',
          sourceExcerpt: 'Terms act as logical clocks allowing nodes to detect obsolete information... Leader --> Follower: Discovers Higher Term Node.'
        }
      ],
      quiz: [
        {
          question: 'In a 7-node Raft consensus cluster, what is the maximum number of simultaneous node failures the cluster can endure while still guaranteeing write availability?',
          options: [
            '1 node failure',
            '2 node failures',
            '3 node failures',
            '4 node failures'
          ],
          correct_option: 2,
          explanation: 'Quorum is floor(7/2) + 1 = 4 nodes. If 3 nodes fail, 4 remain, preserving a strict majority. If 4 nodes fail, only 3 remain, which is less than quorum, causing loss of write availability.',
          sourceExcerpt: 'Quorum Size: Formally defined as floor(N/2) + 1... The cluster maintains availability and consensus as long as a strict quorum of nodes is functional.'
        },
        {
          question: 'Why does a Raft leader never directly commit a log entry from an earlier term by counting replicas alone?',
          options: [
            'Earlier terms use different cryptographic signatures',
            'To avoid overwriting committed entries during unexpected cascade leader crashes; entries from older terms are committed only indirectly by committing an entry from the current term',
            'Because earlier entries are permanently read-only once written',
            'Because followers reject entries with earlier term numbers'
          ],
          correct_option: 1,
          explanation: 'Raft safety guarantees that a leader commits entries from previous terms only indirectly by committing an entry from its current term, preventing log overwriting under complex failover scenarios.',
          sourceExcerpt: 'Leader Completeness: If a log entry is committed in a given term, that entry will be present in the logs of the leaders for all higher-numbered terms... Leader Append-Only Invariant.'
        },
        {
          question: 'Candidate Node A (term 3, last log index 12, last term 2) asks Follower Node B (term 3, last log index 10, last term 3) for its vote. What does Node B do?',
          options: [
            'Votes YES because Candidate A has a longer log (index 12 vs 10)',
            'Votes NO because Node B\'s last log entry has a higher term (term 3 vs 2)',
            'Abstains until a third node responds',
            'Crashes and restarts'
          ],
          correct_option: 1,
          explanation: 'Under Raft\'s Election Restriction rule, comparison is made by term first. Node B has an entry with term 3, whereas Candidate A\'s last entry is only term 2. Therefore, Node B\'s log is more up-to-date and it rejects A.',
          sourceExcerpt: 'Voters must reject candidates whose logs are less up-to-date than their own. A candidate log is more up-to-date if its last log entry has a higher term number; OR if terms are identical, a greater total number of entries.'
        },
        {
          question: 'What is the purpose of the Log Matching Invariant in Raft?',
          options: [
            'It verifies that all network packets are encrypted with AES-256',
            'It ensures that if two logs agree on term and index, all preceding log entries are identical in both logs',
            'It compresses log entries using gzip before sending across RPC',
            'It enforces that only one follower can write to disk at a time'
          ],
          correct_option: 1,
          explanation: 'The Log Matching Invariant states that if two distinct server logs contain an entry with the same index and term, they are guaranteed to contain identical commands in that entry, and their logs are identical in all preceding entries.',
          sourceExcerpt: 'Log Matching Invariant: If two distinct logs contain an entry with identical index and term, they are guaranteed to contain identical commands in that entry, and their logs are identical up to that index.'
        }
      ]
    }
  }
};
