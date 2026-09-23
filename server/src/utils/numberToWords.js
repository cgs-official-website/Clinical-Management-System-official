/**
 * Converts a numeric amount to Indian Rupee Words representation.
 * E.g. 76700 -> "Rupees Seventy-Six Thousand Seven Hundred Only"
 */
export function amountToWordsINR(amount) {
  if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
    return 'Rupees Zero Only'
  }

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ]

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ]

  const convertLessThanOneThousand = (num) => {
    let str = ''
    if (num >= 100) {
      str += ones[Math.floor(num / 100)] + ' Hundred '
      num %= 100
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)]
      if (num % 10 > 0) {
        str += '-' + ones[num % 10]
      }
      str += ' '
    } else if (num > 0) {
      str += ones[num] + ' '
    }
    return str
  }

  let integerPart = Math.floor(amount)
  const decimalPart = Math.round((amount - integerPart) * 100)

  if (integerPart === 0) {
    return decimalPart > 0 ? `Rupees Zero and ${decimalPart}/100 Only` : 'Rupees Zero Only'
  }

  let words = ''

  // Crores (10,000,000)
  if (integerPart >= 10000000) {
    words += convertLessThanOneThousand(Math.floor(integerPart / 10000000)) + 'Crore '
    integerPart %= 10000000
  }

  // Lakhs (100,000)
  if (integerPart >= 100000) {
    words += convertLessThanOneThousand(Math.floor(integerPart / 100000)) + 'Lakh '
    integerPart %= 100000
  }

  // Thousands (1,000)
  if (integerPart >= 1000) {
    words += convertLessThanOneThousand(Math.floor(integerPart / 1000)) + 'Thousand '
    integerPart %= 1000
  }

  // Hundreds, Tens & Units
  if (integerPart > 0) {
    words += convertLessThanOneThousand(integerPart)
  }

  words = words.trim()

  if (decimalPart > 0) {
    return `Rupees ${words} and ${decimalPart}/100 Only`
  }

  return `Rupees ${words} Only`
}
