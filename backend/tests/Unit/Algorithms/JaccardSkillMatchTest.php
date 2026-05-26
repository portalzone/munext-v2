<?php

use App\Services\MLService;

beforeEach(function () {
    $this->ml = new MLService();
});

// ══════════════════════════════════════════════════════
// BOUNDARY VALUE ANALYSIS
// ══════════════════════════════════════════════════════

it('[BVA-ALG1-01] returns 0 when both skill arrays are empty', function () {
    expect($this->ml->skillMatch([], [])['score'])->toBe(0);
});

it('[BVA-ALG1-02] returns 0 when student has no skills but job has requirements', function () {
    expect($this->ml->skillMatch([], ['PHP', 'Laravel'])['score'])->toBe(0);
});

it('[BVA-ALG1-03] returns 0 when job has no requirements but student has skills', function () {
    expect($this->ml->skillMatch(['PHP', 'Laravel'], [])['score'])->toBe(0);
});

it('[BVA-ALG1-04] returns 100 for a single-skill exact match', function () {
    expect($this->ml->skillMatch(['PHP'], ['PHP'])['score'])->toBe(100);
});

it('[BVA-ALG1-05] returns 100 for a multi-skill exact match', function () {
    expect($this->ml->skillMatch(['PHP', 'Laravel', 'Vue'], ['PHP', 'Laravel', 'Vue'])['score'])->toBe(100);
});

it('[BVA-ALG1-06] returns 0 when student and job skills share no overlap', function () {
    expect($this->ml->skillMatch(['Python', 'Django'], ['PHP', 'Laravel'])['score'])->toBe(0);
});

it('[BVA-ALG1-07] returns 67 for 2-of-3 union match — Jaccard = round(2/3 * 100) = 67', function () {
    // intersection={PHP,Laravel}=2, union={PHP,Laravel,PostgreSQL}=3 → 67
    expect($this->ml->skillMatch(['PHP', 'Laravel'], ['PHP', 'Laravel', 'PostgreSQL'])['score'])->toBe(67);
});

it('[BVA-ALG1-08] returns 33 for 1-of-3 union match — Jaccard = round(1/3 * 100) = 33', function () {
    // student=[PHP,Laravel], job=[PHP,Vue] → intersection={PHP}=1, union={PHP,Laravel,Vue}=3
    expect($this->ml->skillMatch(['PHP', 'Laravel'], ['PHP', 'Vue'])['score'])->toBe(33);
});

it('[BVA-ALG1-09] returns 50 for 1-of-2 union match — Jaccard = 1/2 = 50', function () {
    // intersection={PHP}=1, union={PHP,Laravel}=2
    expect($this->ml->skillMatch(['PHP'], ['PHP', 'Laravel'])['score'])->toBe(50);
});

it('[BVA-ALG1-10] returns 20 for 1-of-5 union match — Jaccard = round(1/5 * 100) = 20', function () {
    // student=[PHP,Laravel,Vue], job=[PHP,Go,Rust] → intersection={PHP}=1, union=5 → 20
    expect($this->ml->skillMatch(['PHP', 'Laravel', 'Vue'], ['PHP', 'Go', 'Rust'])['score'])->toBe(20);
});

it('[BVA-ALG1-11] returns 100 for large arrays with full overlap (30 skills)', function () {
    $skills = array_map(fn($i) => "skill-{$i}", range(1, 30));
    expect($this->ml->skillMatch($skills, $skills)['score'])->toBe(100);
});

it('[BVA-ALG1-12] returns 0 for large arrays with zero overlap (20 skills each)', function () {
    $a = array_map(fn($i) => "a-{$i}", range(1, 20));
    $b = array_map(fn($i) => "b-{$i}", range(1, 20));
    expect($this->ml->skillMatch($a, $b)['score'])->toBe(0);
});

// ══════════════════════════════════════════════════════
// EQUIVALENCE PARTITIONING
// ══════════════════════════════════════════════════════

it('[EP-ALG1-01] valid/valid partition: score always falls in [0, 100]', function () {
    $score = $this->ml->skillMatch(['PHP', 'Go'], ['PHP', 'Rust'])['score'];
    expect($score)->toBeGreaterThanOrEqual(0)->toBeLessThanOrEqual(100);
});

it('[EP-ALG1-02] empty/valid partition: empty student always yields 0 across multiple job skill sets', function () {
    foreach ([['PHP'], ['A', 'B', 'C'], range(1, 10)] as $jobSkills) {
        expect($this->ml->skillMatch([], $jobSkills)['score'])->toBe(0);
    }
});

it('[EP-ALG1-03] valid/empty partition: non-empty student with empty job always yields 0', function () {
    foreach ([['PHP'], ['A', 'B', 'C'], range(1, 10)] as $studentSkills) {
        expect($this->ml->skillMatch($studentSkills, [])['score'])->toBe(0);
    }
});

it('[EP-ALG1-04] empty/empty partition: both empty always yields 0', function () {
    expect($this->ml->skillMatch([], [])['score'])->toBe(0);
});

// ══════════════════════════════════════════════════════
// CONTRACT INVARIANTS
// ══════════════════════════════════════════════════════

it('[Contract-ALG1-01] normalises skills to lowercase before comparison', function () {
    expect($this->ml->skillMatch(['PHP', 'LARAVEL'], ['php', 'laravel'])['score'])->toBe(100);
});

it('[Contract-ALG1-02] trims whitespace from skill strings before comparison', function () {
    expect($this->ml->skillMatch([' PHP ', ' Laravel '], ['PHP', 'Laravel'])['score'])->toBe(100);
});

it('[Contract-ALG1-03] deduplicates identical normalised values — PHP and php count as one skill', function () {
    // union should not be inflated by duplicates
    $result = $this->ml->skillMatch(['php', 'PHP'], ['php']);
    expect($result['score'])->toBe(100);
});

it('[Contract-ALG1-04] satisfies Jaccard invariant: score = round(|A∩B| / |A∪B| × 100)', function () {
    // intersection={PHP}=1, union={PHP,Laravel,Vue,Go,Rust}=5 → round(1/5*100)=20
    $result = $this->ml->skillMatch(['PHP', 'Laravel', 'Vue'], ['PHP', 'Go', 'Rust']);
    expect($result['score'])->toBe(20);
});

// ══════════════════════════════════════════════════════
// RETURN STRUCTURE
// ══════════════════════════════════════════════════════

it('[Structure-ALG1-01] matched_skills contains only skills present in both arrays (normalised)', function () {
    $result = $this->ml->skillMatch(['PHP', 'Laravel', 'Vue'], ['PHP', 'Laravel', 'Go']);
    expect($result['matched_skills'])
        ->toContain('php')
        ->toContain('laravel')
        ->not->toContain('vue')
        ->not->toContain('go');
});

it('[Structure-ALG1-02] missing_skills contains job skills absent from student profile', function () {
    $result = $this->ml->skillMatch(['PHP'], ['PHP', 'Laravel', 'PostgreSQL']);
    expect($result['missing_skills'])
        ->toContain('laravel')
        ->toContain('postgresql')
        ->not->toContain('php');
});

it('[Structure-ALG1-03] extra_skills contains student skills not required by the job', function () {
    $result = $this->ml->skillMatch(['PHP', 'Laravel', 'Vue'], ['PHP']);
    expect($result['extra_skills'])
        ->toContain('laravel')
        ->toContain('vue')
        ->not->toContain('php');
});

it('[Structure-ALG1-04] score is an integer not a float', function () {
    $result = $this->ml->skillMatch(['PHP', 'Laravel'], ['PHP', 'Laravel', 'PostgreSQL']);
    expect($result['score'])->toBeInt();
});

it('[Structure-ALG1-05] matched_skills is empty when there is no overlap', function () {
    $result = $this->ml->skillMatch(['Python'], ['PHP']);
    expect($result['matched_skills'])->toBeEmpty();
});
