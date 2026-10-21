// Educational Notes Database for SS+2 High School Ghaghra
// Dedicated Subject: Information Technology (IT / ITeS) - Vocational Code 402/802 for Classes 9th to 12th

const SCHOOL_CONFIG = {
  name: "SS+2 HIGH SCHOOL GHAGHRA",
  hindiName: "एस.एस. +2 उच्च विद्यालय घाघरा",
  subTitle: "IT / ITeS Vocational Learning & Notes Portal",
  session: "Academic Session 2025 - 2026",
  location: "Ghaghra, Gumla, Jharkhand",
  subjectName: "Information Technology (IT/ITeS) - Sub Code 402/802",
  helpline: "support@sshsghaghra.edu.in"
};

// Posters / Notices shown in the bottom section of Page 1
const POSTERS_DATA = [
  {
    id: 1,
    tag: "Syllabus 2025-26",
    badgeColor: "bg-blue-500",
    title: "Official IT / ITeS Syllabus & Blueprint Uploaded",
    subtitle: "Complete curriculum, unit-wise marks distribution, and practical exam pattern for Classes 9th, 10th, 11th & 12th.",
    date: "Academic Year 2025-26",
    icon: "📋"
  },
  {
    id: 2,
    tag: "Study Material",
    badgeColor: "bg-emerald-500",
    title: "Part A (Employability) & Part B (IT Skills) Notes",
    subtitle: "Digital Documentation, Electronic Spreadsheets, DBMS, and Web Applications study notes are ready for offline download.",
    date: "Latest Curriculum",
    icon: "💻"
  },
  {
    id: 3,
    tag: "Offline Mode",
    badgeColor: "bg-amber-500",
    title: "Install Android App for 100% Offline Access",
    subtitle: "Save notes and syllabus directly to your phone. Study anytime without internet connection.",
    date: "PWA Feature",
    icon: "📱"
  }
];

// Notes Organized by Class (9th, 10th, 11th, 12th) - Dedicated to IT / ITeS
const CLASSES_DATA = {
  "9th": {
    name: "Class 9th",
    hindiName: "कक्षा 9वीं",
    description: "IT/ITeS (Code 402) - Foundation Level Vocational Curriculum & Notes",
    subjects: [
      {
        id: "syllabus",
        name: "📋 Syllabus (पाठ्यक्रम)",
        icon: "📋",
        color: "#0284c7",
        isSyllabusSection: true,
        notes: [
          {
            id: "9-it-syl-official",
            title: "Class 9th IT/ITeS: Official Curriculum & Scheme 2025-26",
            hindiTitle: "कक्षा 9 आईटी/आईटीईएस आधिकारिक पाठ्यक्रम एवं अंक विभाजन 2025-26",
            fileUrl: "./notes/class9_it_syllabus.pdf",
            fileSize: "1.2 MB",
            pages: 14,
            type: "PDF",
            uploadedAt: "Session 2025-26",
            isNew: true,
            isSyllabus: true
          }
        ]
      },
      {
        id: "part-b",
        name: "💻 Part B: IT Specific Skills (आईटी कौशल)",
        icon: "💻",
        color: "#2563eb",
        notes: [
          {
            id: "9-it-u1-intro",
            title: "Unit 1: Introduction to IT & ITeS Industry",
            hindiTitle: "इकाई 1: सूचना प्रौद्योगिकी एवं आईटीईएस उद्योग का परिचय",
            fileUrl: "./notes/class9_it_unit1.pdf",
            fileSize: "1.4 MB",
            pages: 12,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          },
          {
            id: "9-it-u2-keyboarding",
            title: "Unit 2: Data Entry & Keyboarding Skills",
            hindiTitle: "इकाई 2: डेटा एंट्री एवं कीबोर्डिंग कौशल - रैपिड टाइपिंग ट्यूटर",
            fileUrl: "./notes/class9_it_unit1.pdf",
            fileSize: "1.6 MB",
            pages: 15,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          },
          {
            id: "9-it-u3-digital-doc",
            title: "Unit 3: Digital Documentation (LibreOffice Writer / Word)",
            hindiTitle: "इकाई 3: डिजिटल दस्तावेज़ीकरण - राइटर/वर्ड का उपयोग",
            fileUrl: "./notes/class9_it_unit1.pdf",
            fileSize: "2.1 MB",
            pages: 18,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          },
          {
            id: "9-it-u4-spreadsheet",
            title: "Unit 4: Electronic Spreadsheet (LibreOffice Calc / Excel)",
            hindiTitle: "इकाई 4: इलेक्ट्रॉनिक स्प्रेडशीट - फॉर्मूले एवं चार्ट",
            fileUrl: "./notes/class9_it_unit1.pdf",
            fileSize: "2.4 MB",
            pages: 20,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "part-a",
        name: "📖 Part A: Employability Skills (रोजगार कौशल)",
        icon: "📖",
        color: "#059669",
        notes: [
          {
            id: "9-it-parta-comm",
            title: "Unit 1: Communication Skills - Verbal & Non-Verbal",
            hindiTitle: "रोजगार कौशल इकाई 1: संचार कौशल (मौखिक एवं गैर-मौखिक)",
            fileUrl: "./notes/class9_it_unit1.pdf",
            fileSize: "1.1 MB",
            pages: 10,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          },
          {
            id: "9-it-parta-ict",
            title: "Unit 3: Basic ICT Skills - Computer Care & Internet Safety",
            hindiTitle: "रोजगार कौशल इकाई 3: बेसिक आईसीटी कौशल एवं साइबर सुरक्षा",
            fileUrl: "./notes/class9_it_unit1.pdf",
            fileSize: "1.3 MB",
            pages: 12,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: false
          }
        ]
      },
      {
        id: "sample-papers",
        name: "📝 Model Papers & Blueprint (मॉडल प्रश्न पत्र)",
        icon: "📝",
        color: "#d97706",
        notes: [
          {
            id: "9-it-model-paper",
            title: "Class 9th IT-402 Annual Model Question Paper with Solution",
            hindiTitle: "कक्षा 9 आईटी-402 वार्षिक परीक्षा मॉडल प्रश्न पत्र एवं उत्तर कुंजी",
            fileUrl: "./notes/class9_it_unit1.pdf",
            fileSize: "1.5 MB",
            pages: 12,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          }
        ]
      }
    ]
  },

  "10th": {
    name: "Class 10th",
    hindiName: "कक्षा 10वीं",
    description: "IT/ITeS (Code 402) - Matriculation Board Examination Syllabus & Notes",
    subjects: [
      {
        id: "syllabus",
        name: "📋 Syllabus (पाठ्यक्रम)",
        icon: "📋",
        color: "#0284c7",
        isSyllabusSection: true,
        notes: [
          {
            id: "10-it-syl-official",
            title: "Class 10th IT/ITeS: Board Exam Syllabus & Scheme 2025-26",
            hindiTitle: "कक्षा 10 आईटी-402 बोर्ड परीक्षा आधिकारिक पाठ्यक्रम एवं ब्लूप्रिंट 2025-26",
            fileUrl: "./notes/class10_it_syllabus.pdf",
            fileSize: "1.5 MB",
            pages: 16,
            type: "PDF",
            uploadedAt: "Session 2025-26",
            isNew: true,
            isSyllabus: true
          }
        ]
      },
      {
        id: "part-b",
        name: "💻 Part B: IT Specific Skills (आईटी कौशल)",
        icon: "💻",
        color: "#2563eb",
        notes: [
          {
            id: "10-it-u3-dbms",
            title: "Unit 3: Database Management System (DBMS / Base)",
            hindiTitle: "इकाई 3: डेटाबेस प्रबंधन प्रणाली (डीबीएमएस) - तालिका, कुंजी एवं एसक्यूएल",
            fileUrl: "./notes/class10_it_dbms.pdf",
            fileSize: "2.3 MB",
            pages: 22,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          },
          {
            id: "10-it-u1-digital-doc-adv",
            title: "Unit 1: Digital Documentation (Advanced)",
            hindiTitle: "इकाई 1: उन्नत डिजिटल दस्तावेज़ीकरण - स्टाइल्स, टेबल ऑफ कंटेंट्स, मेल मर्ज",
            fileUrl: "./notes/class10_it_dbms.pdf",
            fileSize: "2.0 MB",
            pages: 18,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          },
          {
            id: "10-it-u2-electronic-sheet-adv",
            title: "Unit 2: Electronic Spreadsheet (Advanced)",
            hindiTitle: "इकाई 2: उन्नत इलेक्ट्रॉनिक स्प्रेडशीट - कंसोलिडेट, गोल सीक, मैक्रोज़",
            fileUrl: "./notes/class10_it_dbms.pdf",
            fileSize: "2.2 MB",
            pages: 20,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          },
          {
            id: "10-it-u4-web-apps",
            title: "Unit 4: Web Applications & Cyber Security",
            hindiTitle: "इकाई 4: वेब अनुप्रयोग एवं सुरक्षा - नेटवर्किंग, ब्लॉगिंग, ऑनलाइन सुरक्षा",
            fileUrl: "./notes/class10_it_dbms.pdf",
            fileSize: "2.5 MB",
            pages: 24,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          }
        ]
      },
      {
        id: "part-a",
        name: "📖 Part A: Employability Skills (रोजगार कौशल)",
        icon: "📖",
        color: "#059669",
        notes: [
          {
            id: "10-it-parta-ict",
            title: "Unit 3: Basic ICT Skills (Operating System & Maintenance)",
            hindiTitle: "इकाई 3: बेसिक आईसीटी कौशल - ऑपरेटिंग सिस्टम एवं सिस्टम मेंटेनेंस",
            fileUrl: "./notes/class10_it_dbms.pdf",
            fileSize: "1.4 MB",
            pages: 14,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          },
          {
            id: "10-it-parta-entrepreneur",
            title: "Unit 4: Entrepreneurial Skills - Characteristics of Entrepreneurs",
            hindiTitle: "इकाई 4: उद्यमिता कौशल - सफल उद्यमी के गुण एवं भूमिका",
            fileUrl: "./notes/class10_it_dbms.pdf",
            fileSize: "1.2 MB",
            pages: 12,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "sample-papers",
        name: "📝 Model Papers & Blueprint (मॉडल प्रश्न पत्र)",
        icon: "📝",
        color: "#d97706",
        notes: [
          {
            id: "10-it-board-sample",
            title: "Class 10 IT-402 Official Board Model Question Paper 2026",
            hindiTitle: "कक्षा 10वीं आईटी-402 बोर्ड परीक्षा मॉडल प्रश्न पत्र 2026",
            fileUrl: "./notes/class10_it_dbms.pdf",
            fileSize: "1.8 MB",
            pages: 16,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          }
        ]
      }
    ]
  },

  "11th": {
    name: "Class 11th (+2)",
    hindiName: "कक्षा 11वीं (+2)",
    description: "IT/ITeS (Code 802) - Intermediate 1st Year Vocational Curriculum",
    subjects: [
      {
        id: "syllabus",
        name: "📋 Syllabus (पाठ्यक्रम)",
        icon: "📋",
        color: "#0284c7",
        isSyllabusSection: true,
        notes: [
          {
            id: "11-it-syl-official",
            title: "Class 11th IT/ITeS: Official Syllabus & Practical Scheme 2025-26",
            hindiTitle: "कक्षा 11वीं आईटी/आईटीईएस (+2) आधिकारिक पाठ्यक्रम 2025-26",
            fileUrl: "./notes/class11_it_syllabus.pdf",
            fileSize: "1.6 MB",
            pages: 18,
            type: "PDF",
            uploadedAt: "Session 2025-26",
            isNew: true,
            isSyllabus: true
          }
        ]
      },
      {
        id: "part-b",
        name: "💻 Part B: IT Specific Skills (आईटी कौशल)",
        icon: "💻",
        color: "#2563eb",
        notes: [
          {
            id: "11-it-u1-networking",
            title: "Unit 1: Computer Organization, Architecture & Networking",
            hindiTitle: "इकाई 1: कंप्यूटर संगठन, आर्किटेक्चर एवं नेटवर्किंग फंडामेंटल्स",
            fileUrl: "./notes/class11_it_networking.pdf",
            fileSize: "2.6 MB",
            pages: 24,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          },
          {
            id: "11-it-u2-web-tech",
            title: "Unit 2: Web Technology - HTML, CSS & Basic JavaScript",
            hindiTitle: "इकाई 2: वेब टेक्नोलॉजी - वेब पेज डिजाइनिंग एवं स्क्रिप्टिंग",
            fileUrl: "./notes/class11_it_networking.pdf",
            fileSize: "2.8 MB",
            pages: 26,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          },
          {
            id: "11-it-u3-office-auto",
            title: "Unit 3: Advanced Office Automation & Spreadsheets",
            hindiTitle: "इकाई 3: उन्नत कार्यालय स्वचालन एवं डेटा विश्लेषण",
            fileUrl: "./notes/class11_it_networking.pdf",
            fileSize: "2.3 MB",
            pages: 20,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "part-a",
        name: "📖 Part A: Employability Skills (रोजगार कौशल)",
        icon: "📖",
        color: "#059669",
        notes: [
          {
            id: "11-it-parta-skills",
            title: "Part A: Employability Skills Module for Class 11",
            hindiTitle: "कक्षा 11 रोजगार कौशल - संचार, स्व-प्रबंधन एवं हरित कौशल",
            fileUrl: "./notes/class11_it_networking.pdf",
            fileSize: "1.7 MB",
            pages: 16,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "sample-papers",
        name: "📝 Model Papers & Blueprint (मॉडल प्रश्न पत्र)",
        icon: "📝",
        color: "#d97706",
        notes: [
          {
            id: "11-it-model-paper",
            title: "Class 11th IT-802 Annual Model Paper & Exam Blueprint",
            hindiTitle: "कक्षा 11वीं आईटी-802 वार्षिक मॉडल प्रश्न पत्र एवं अंक योजना",
            fileUrl: "./notes/class11_it_networking.pdf",
            fileSize: "1.9 MB",
            pages: 15,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          }
        ]
      }
    ]
  },

  "12th": {
    name: "Class 12th (+2)",
    hindiName: "कक्षा 12वीं (+2)",
    description: "IT/ITeS (Code 802) - Final Board Examination Syllabus & Comprehensive Study Notes",
    subjects: [
      {
        id: "syllabus",
        name: "📋 Syllabus (पाठ्यक्रम)",
        icon: "📋",
        color: "#0284c7",
        isSyllabusSection: true,
        notes: [
          {
            id: "12-it-syl-official",
            title: "Class 12th IT/ITeS: Board Exam Syllabus & Marking Scheme 2025-26",
            hindiTitle: "कक्षा 12वीं आईटी-802 फाइनल बोर्ड परीक्षा पाठ्यक्रम एवं अंक योजना 2025-26",
            fileUrl: "./notes/class12_it_syllabus.pdf",
            fileSize: "1.8 MB",
            pages: 20,
            type: "PDF",
            uploadedAt: "Session 2025-26",
            isNew: true,
            isSyllabus: true
          }
        ]
      },
      {
        id: "part-b",
        name: "💻 Part B: IT Specific Skills (आईटी कौशल)",
        icon: "💻",
        color: "#2563eb",
        notes: [
          {
            id: "12-it-u1-adv-dbms",
            title: "Unit 1: Advanced Database Concepts & SQL Operations",
            hindiTitle: "इकाई 1: उन्नत डेटाबेस अवधारणाएँ - डीडीएल, डीएमएल एवं एसक्यूएल जॉइन्स",
            fileUrl: "./notes/class12_it_advanced_db.pdf",
            fileSize: "3.2 MB",
            pages: 28,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          },
          {
            id: "12-it-u2-web-dev",
            title: "Unit 2: Web Development - Dynamic Websites & JavaScript",
            hindiTitle: "इकाई 2: वेब विकास - जावास्क्रिप्ट, फॉर्म वैलिडेशन एवं सीएसएस लेआउट",
            fileUrl: "./notes/class12_it_advanced_db.pdf",
            fileSize: "3.5 MB",
            pages: 32,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          },
          {
            id: "12-it-u3-cyber-security",
            title: "Unit 3: Cyber Safety, Information Security & IT Act",
            hindiTitle: "इकाई 3: साइबर सुरक्षा, डेटा गोपनीयता एवं सूचना प्रौद्योगिकी अधिनियम",
            fileUrl: "./notes/class12_it_advanced_db.pdf",
            fileSize: "2.6 MB",
            pages: 24,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "part-a",
        name: "📖 Part A: Employability Skills (रोजगार कौशल)",
        icon: "📖",
        color: "#059669",
        notes: [
          {
            id: "12-it-parta-complete",
            title: "Part A: Employability Skills - Class 12 Full Revision Guide",
            hindiTitle: "कक्षा 12वीं रोजगार कौशल - संपूर्ण रिवीजन नोट्स एवं महत्वपूर्ण प्रश्न",
            fileUrl: "./notes/class12_it_advanced_db.pdf",
            fileSize: "1.9 MB",
            pages: 18,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "sample-papers",
        name: "📝 Model Papers & Blueprint (मॉडल प्रश्न पत्र)",
        icon: "📝",
        color: "#d97706",
        notes: [
          {
            id: "12-it-board-sample-paper",
            title: "Class 12th IT-802 Board Examination Official Model Paper 2026",
            hindiTitle: "कक्षा 12वीं आईटी-802 बोर्ड परीक्षा मॉडल प्रश्न पत्र 2026 (हल सहित)",
            fileUrl: "./notes/class12_it_advanced_db.pdf",
            fileSize: "2.1 MB",
            pages: 18,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          }
        ]
      }
    ]
  }
};

// Global Browser Window Bindings
if (typeof window !== 'undefined') {
  window.SCHOOL_CONFIG = SCHOOL_CONFIG;
  window.POSTERS_DATA = POSTERS_DATA;
  window.CLASSES_DATA = CLASSES_DATA;
}
