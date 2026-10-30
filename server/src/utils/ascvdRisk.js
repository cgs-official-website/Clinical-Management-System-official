/**
 * ACC/AHA 2013 Pooled Cohort Equations (10-year ASCVD risk).
 * Valid for ages 40-79, total cholesterol 130-320 mg/dL, HDL 20-100 mg/dL,
 * systolic BP 90-200 mmHg. Race: 'AFRICAN_AMERICAN' uses the African American
 * equations; any other value uses the "white / other" equations.
 */

const COEFFS = {
    WHITE_FEMALE: {
        lnAge: -29.799, lnAgeSq: 4.884, lnTc: 13.54, lnAgeLnTc: -3.114,
        lnHdl: -13.578, lnAgeLnHdl: 3.149,
        lnTreatedSbp: 2.019, lnAgeLnTreatedSbp: 0, lnUntreatedSbp: 1.957, lnAgeLnUntreatedSbp: 0,
        smoker: 7.574, lnAgeSmoker: -1.665, diabetes: 0.661,
        mean: -29.18, s10: 0.9665,
    },
    AA_FEMALE: {
        lnAge: 17.114, lnAgeSq: 0, lnTc: 0.94, lnAgeLnTc: 0,
        lnHdl: -18.92, lnAgeLnHdl: 4.475,
        lnTreatedSbp: 29.291, lnAgeLnTreatedSbp: -6.432, lnUntreatedSbp: 27.82, lnAgeLnUntreatedSbp: -6.087,
        smoker: 0.691, lnAgeSmoker: 0, diabetes: 0.874,
        mean: 86.61, s10: 0.9533,
    },
    WHITE_MALE: {
        lnAge: 12.344, lnAgeSq: 0, lnTc: 11.853, lnAgeLnTc: -2.664,
        lnHdl: -7.99, lnAgeLnHdl: 1.769,
        lnTreatedSbp: 1.797, lnAgeLnTreatedSbp: 0, lnUntreatedSbp: 1.764, lnAgeLnUntreatedSbp: 0,
        smoker: 7.837, lnAgeSmoker: -1.795, diabetes: 0.658,
        mean: 61.18, s10: 0.9144,
    },
    AA_MALE: {
        lnAge: 2.469, lnAgeSq: 0, lnTc: 0.302, lnAgeLnTc: 0,
        lnHdl: -0.307, lnAgeLnHdl: 0,
        lnTreatedSbp: 1.916, lnAgeLnTreatedSbp: 0, lnUntreatedSbp: 1.809, lnAgeLnUntreatedSbp: 0,
        smoker: 0.549, lnAgeSmoker: 0, diabetes: 0.645,
        mean: 19.54, s10: 0.8954,
    },
}

export const ASCVD_LIMITS = {
    age: [40, 79],
    totalCholesterol: [130, 320],
    hdl: [20, 100],
    sbp: [90, 200],
}

/** Returns an array of human readable problems (empty when inputs are valid). */
export function validateAscvdInputs({ age, totalCholesterol, hdl, sbp }) {
    const problems = []
    const check = (label, value, [min, max], unit = '') => {
        if (!Number.isFinite(value) || value < min || value > max) {
            problems.push(`${label} must be between ${min} and ${max}${unit}`)
        }
    }
    check('Age', age, ASCVD_LIMITS.age, ' years')
    check('Total cholesterol', totalCholesterol, ASCVD_LIMITS.totalCholesterol, ' mg/dL')
    check('HDL cholesterol', hdl, ASCVD_LIMITS.hdl, ' mg/dL')
    check('Systolic BP', sbp, ASCVD_LIMITS.sbp, ' mmHg')
    return problems
}

export function calculateAscvdRisk({ age, sex, race, totalCholesterol, hdl, sbp, onBpTreatment, smoker, diabetes }) {
    const isFemale = String(sex).toLowerCase().startsWith('f')
    const isAA = String(race).toUpperCase() === 'AFRICAN_AMERICAN'
    const key = `${isAA ? 'AA' : 'WHITE'}_${isFemale ? 'FEMALE' : 'MALE'}`
    const c = COEFFS[key]

    const lnAge = Math.log(age)
    const lnTc = Math.log(totalCholesterol)
    const lnHdl = Math.log(hdl)
    const lnSbp = Math.log(sbp)
    const smk = smoker ? 1 : 0
    const dm = diabetes ? 1 : 0

    let sum =
        c.lnAge * lnAge +
        c.lnAgeSq * lnAge * lnAge +
        c.lnTc * lnTc +
        c.lnAgeLnTc * lnAge * lnTc +
        c.lnHdl * lnHdl +
        c.lnAgeLnHdl * lnAge * lnHdl +
        c.smoker * smk +
        c.lnAgeSmoker * lnAge * smk +
        c.diabetes * dm

    if (onBpTreatment) {
        sum += c.lnTreatedSbp * lnSbp + c.lnAgeLnTreatedSbp * lnAge * lnSbp
    } else {
        sum += c.lnUntreatedSbp * lnSbp + c.lnAgeLnUntreatedSbp * lnAge * lnSbp
    }

    const risk = 1 - Math.pow(c.s10, Math.exp(sum - c.mean))
    return Math.round(risk * 1000) / 10 // percent, 1 decimal
}

export function categorizeRisk(percent) {
    if (percent < 5) return 'LOW'
    if (percent < 7.5) return 'BORDERLINE'
    if (percent < 20) return 'INTERMEDIATE'
    return 'HIGH'
}

/** Decision-support text only; the signing cardiologist can edit it. */
export function buildRecommendation({ riskCategory, cacScore, diabetes, smoker, onStatin }) {
    const parts = []
    switch (riskCategory) {
        case 'HIGH':
            parts.push('High 10-year ASCVD risk: high-intensity statin therapy is generally recommended, with a target LDL-C reduction of 50% or more.')
            parts.push('Aim for BP below 130/80 mmHg and review need for add-on lipid lowering therapy.')
            break
        case 'INTERMEDIATE':
            parts.push('Intermediate risk: moderate-intensity statin therapy is generally recommended after a risk discussion, targeting an LDL-C reduction of 30-49%.')
            break
        case 'BORDERLINE':
            parts.push('Borderline risk: consider statin therapy if risk-enhancing factors are present; emphasise lifestyle measures.')
            break
        default:
            parts.push('Low risk: emphasise a heart-healthy diet and at least 150 minutes per week of aerobic activity. Re-assess in 4-6 years.')
    }
    if (Number.isFinite(cacScore)) {
        if (cacScore === 0) parts.push('CAC = 0 lowers the near-term risk estimate.')
        else if (cacScore >= 100) parts.push(`CAC = ${cacScore} indicates significant coronary plaque; favour statin therapy.`)
        else parts.push(`CAC = ${cacScore} indicates mild coronary plaque.`)
    }
    if (smoker) parts.push('Enrol in a smoking cessation programme.')
    if (diabetes) parts.push('Optimise glycaemic control alongside lipid and BP targets.')
    if (onStatin) parts.push('Patient is already on a statin: check adherence and repeat lipid profile in 4-12 weeks.')
    return parts.join(' ')
}
