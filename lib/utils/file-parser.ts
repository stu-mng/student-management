import Papa from "papaparse"
import * as XLSX from "xlsx"

export interface StudentImportData {
  name: string
  gender: "男" | "女"
  grade: string
  class: string
  email: string
  region: string
  student_type: "新生" | "舊生"
  is_disadvantaged: "是" | "否"
  family_background?: string
  cultural_disadvantage_factors?: string
  personal_background_notes?: string
  registration_motivation?: string
  account_username?: string
  account_password?: string
}

// 欄位名稱對照表，包含所有可能的變體
const FIELD_MAPPINGS = {
  name: ["name", "姓名"],
  gender: ["gender", "性別"],
  grade: ["grade", "年級"],
  class: ["class", "班級"],
  region: ["region", "區域"],
  email: ["email", "電子郵件", "電子信箱", "信箱"],
  student_type: ["student_type", "studenttype", "小學伴類型", "類型"],
  is_disadvantaged: ["is_disadvantaged", "isdisadvantaged", "是否為弱勢生", "弱勢生", "是否弱勢"],
  family_background: ["family_background", "familybackground", "家庭背景描述", "家庭背景"],
  cultural_disadvantage_factors: ["cultural_disadvantage_factors", "culturaldisadvantagefactors", "文化不利因素描述", "文化不利因素"],
  personal_background_notes: ["personal_background_notes", "personalbackgroundnotes", "個人背景補充說明", "個人背景"],
  registration_motivation: ["registration_motivation", "registrationmotivation", "報名動機", "動機"],
  account_username: ["account_username", "accountusername", "系統帳號", "帳號", "使用者名稱"],
  account_password: ["account_password", "accountpassword", "系統密碼", "密碼"]
}

// 將物件的所有鍵轉換為小寫
function getLowercaseKeys(obj: any): { [key: string]: any } {
  return Object.keys(obj).reduce((acc: { [key: string]: any }, key: string) => {
    acc[key.toLowerCase()] = obj[key]
    return acc
  }, {})
}

// 根據對照表找到正確的欄位名稱
function findMatchingField(fieldName: string, mappings: typeof FIELD_MAPPINGS): string | null {
  const lowercaseField = fieldName.toLowerCase()
  
  for (const [key, variants] of Object.entries(mappings)) {
    if (variants.some(variant => variant.toLowerCase() === lowercaseField)) {
      return key
    }
  }
  
  return null
}

export async function parseStudentFile(file: File): Promise<StudentImportData[]> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()

    fileReader.onload = async (e) => {
      try {
        const result = e.target?.result

        if (!result) {
          reject(new Error("Failed to read file"))
          return
        }

        let data: any[]

        if (file.name.endsWith(".csv")) {
          // Parse CSV
          const csvResult = Papa.parse(result as string, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim().toLowerCase()
          })

          if (csvResult.errors.length > 0) {
            reject(new Error("CSV parsing error: " + csvResult.errors[0].message))
            return
          }

          data = csvResult.data
        } else {
          // Parse Excel
          const workbook = XLSX.read(result, { type: "binary" })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          data = XLSX.utils.sheet_to_json(worksheet)
        }

        // 驗證並轉換欄位名稱
        const students = data.map((row) => {
          // 將所有欄位名稱轉換為小寫
          const lowercaseRow = getLowercaseKeys(row)
          
          const mappedData: Partial<StudentImportData> = {}
          
          // 遍歷每個欄位並尋找匹配
          for (const [key, variants] of Object.entries(FIELD_MAPPINGS)) {
            // 尋找第一個匹配的欄位值
            const value = variants
              .map(variant => variant.toLowerCase())
              .reduce((acc, variant) => acc || lowercaseRow[variant], undefined)
            
            if (value !== undefined) {
              mappedData[key as keyof StudentImportData] = value
            }
          }

          return mappedData as StudentImportData
        })

        resolve(students)
      } catch (error) {
        reject(error)
      }
    }

    fileReader.onerror = () => {
      reject(new Error("File reading failed"))
    }

    if (file.name.endsWith(".csv")) {
      fileReader.readAsText(file)
    } else {
      fileReader.readAsBinaryString(file)
    }
  })
} 