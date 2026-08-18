package main

import (
	"fmt"
	"time"
)

// เขียน function เพื่อหา palindrome date (DDMMYYYY) ในอนาคตที่ใกล้ที่สุด
func isPalindrome(text string) bool {
	left := 0
	right := len(text) - 1

	for left < right {
		if text[left] != text[right] {
			return false
		}
		left++
		right--
	}
	return true
}

func findNextPalindromeDate(start time.Time) (time.Time, string) {
	curr := start.AddDate(0, 0, 1)
	for {
		dateStr := curr.Format("02012006")
		if isPalindrome(dateStr) {
			return curr, dateStr
		}
		curr = curr.AddDate(0, 0, 1)
	}
}

func main() {
	now := time.Now()
	nextDate, dateStr := findNextPalindromeDate(now)
	fmt.Printf("Today: %s\n", now.Format("2006-01-02"))
	fmt.Printf("Nearest future palindrome date (DDMMYYYY): %s (%s)\n", dateStr, nextDate.Format("2006-01-02"))
}

