// Educational Notes Database for SS+2 High School Ghaghra
// Teachers and administrators can easily add or edit subjects and notes here

const SCHOOL_CONFIG = {
  name: "SS+2 HIGH SCHOOL GHAGHRA",
  hindiName: "एस.एस. +2 उच्च विद्यालय घाघरा",
  subTitle: "E-Learning & Digital Notes Portal",
  session: "Academic Session 2025 - 2026",
  location: "Ghaghra, Gumla, Jharkhand",
  helpline: "support@sshsghaghra.edu.in"
};

// Posters / Notices shown in the bottom section of Page 1
const POSTERS_DATA = [
  {
    id: 1,
    tag: "Notice",
    badgeColor: "bg-red-500",
    title: "Annual Board Exam Preparation Notes 2026",
    subtitle: "Complete revision chapters and sample papers uploaded for Classes 10th & 12th.",
    date: "Updated Today",
    icon: "📢"
  },
  {
    id: 2,
    tag: "Study Material",
    badgeColor: "bg-blue-500",
    title: "Class 9th & 11th Science & Math Notes Available",
    subtitle: "All NCERT/JCERT chapter summaries are ready for offline viewing and download.",
    date: "This Week",
    icon: "📚"
  },
  {
    id: 3,
    tag: "Offline Mode",
    badgeColor: "bg-emerald-500",
    title: "Install as Android App for Offline Access",
    subtitle: "Click 'Install App' to save notes directly to your phone and study without internet.",
    date: "Tip",
    icon: "📱"
  }
];

// Notes Organized by Class (9th, 10th, 11th, 12th)
const CLASSES_DATA = {
  "9th": {
    name: "Class 9th",
    hindiName: "कक्षा 9वीं",
    description: "Foundation study materials & chapter notes for Secondary examination",
    subjects: [
      {
        id: "science",
        name: "Science (विज्ञान)",
        icon: "🔬",
        color: "#0284c7",
        notes: [
          {
            id: "9-sci-ch1",
            title: "Chapter 1: Matter in Our Surroundings",
            hindiTitle: "अध्याय 1: हमारे आस-पास के पदार्थ",
            fileUrl: "./notes/class9_science_ch1.pdf",
            fileSize: "1.4 MB",
            pages: 12,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          },
          {
            id: "9-sci-ch2",
            title: "Chapter 2: Is Matter Around Us Pure?",
            hindiTitle: "अध्याय 2: क्या हमारे आस-पास के पदार्थ शुद्ध हैं?",
            fileUrl: "./notes/class9_science_ch1.pdf",
            fileSize: "1.8 MB",
            pages: 14,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: false
          },
          {
            id: "9-sci-ch5",
            title: "Chapter 5: The Fundamental Unit of Life (Cell)",
            hindiTitle: "अध्याय 5: जीवन की मौलिक इकाई (कोशिका)",
            fileUrl: "./notes/class9_science_ch1.pdf",
            fileSize: "2.1 MB",
            pages: 18,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "maths",
        name: "Mathematics (गणित)",
        icon: "📐",
        color: "#d97706",
        notes: [
          {
            id: "9-math-ch1",
            title: "Chapter 1: Number Systems",
            hindiTitle: "अध्याय 1: संख्या पद्धति - महत्वपूर्ण सूत्र एवं उदाहरण",
            fileUrl: "./notes/class9_math_ch1.pdf",
            fileSize: "1.6 MB",
            pages: 15,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          },
          {
            id: "9-math-ch2",
            title: "Chapter 2: Polynomials",
            hindiTitle: "अध्याय 2: बहुपद - गुणनखंड एवं शेषफल प्रमेय",
            fileUrl: "./notes/class9_math_ch1.pdf",
            fileSize: "2.3 MB",
            pages: 20,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "social-science",
        name: "Social Science (सामाजिक विज्ञान)",
        icon: "🌍",
        color: "#059669",
        notes: [
          {
            id: "9-sst-ch1",
            title: "History Ch 1: The French Revolution",
            hindiTitle: "इतिहास अध्याय 1: फ्रांसीसी क्रांति",
            fileUrl: "./notes/class9_science_ch1.pdf",
            fileSize: "1.9 MB",
            pages: 16,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: false
          },
          {
            id: "9-sst-geo1",
            title: "Geography Ch 1: India - Size and Location",
            hindiTitle: "भूगोल अध्याय 1: भारत - आकार और स्थिति",
            fileUrl: "./notes/class9_science_ch1.pdf",
            fileSize: "1.3 MB",
            pages: 10,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "hindi",
        name: "Hindi (हिंदी क्षितिज एवं कृतिका)",
        icon: "📖",
        color: "#dc2626",
        notes: [
          {
            id: "9-hin-ch1",
            title: "दो बैलों की कथा (प्रेमचंद) - सारांश एवं प्रश्नोत्तर",
            hindiTitle: "गद्य खंड पाठ 1: दो बैलों की कथा",
            fileUrl: "./notes/class9_science_ch1.pdf",
            fileSize: "980 KB",
            pages: 8,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "english",
        name: "English (Beehive & Moments)",
        icon: "✍️",
        color: "#7c3aed",
        notes: [
          {
            id: "9-eng-ch1",
            title: "The Fun They Had - Summary & Questions",
            hindiTitle: "Chapter 1: The Fun They Had by Isaac Asimov",
            fileUrl: "./notes/class9_science_ch1.pdf",
            fileSize: "850 KB",
            pages: 9,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: false
          }
        ]
      }
    ]
  },

  "10th": {
    name: "Class 10th",
    hindiName: "कक्षा 10वीं",
    description: "Matriculation Board Examination notes, formula sheets & previous papers",
    subjects: [
      {
        id: "science",
        name: "Science (विज्ञान)",
        icon: "⚡",
        color: "#0284c7",
        notes: [
          {
            id: "10-sci-ch1",
            title: "Chapter 1: Chemical Reactions and Equations",
            hindiTitle: "अध्याय 1: रासायनिक अभिक्रियाएँ एवं समीकरण",
            fileUrl: "./notes/class10_science_ch1.pdf",
            fileSize: "2.1 MB",
            pages: 16,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          },
          {
            id: "10-sci-ch6",
            title: "Chapter 6: Life Processes (जैव प्रक्रम)",
            hindiTitle: "अध्याय 6: जैव प्रक्रम - पोषण, श्वसन एवं उत्सर्जन",
            fileUrl: "./notes/class10_science_ch1.pdf",
            fileSize: "2.8 MB",
            pages: 22,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: true
          },
          {
            id: "10-sci-ch12",
            title: "Chapter 12: Electricity (विद्युत)",
            hindiTitle: "अध्याय 12: विद्युत परिपथ, ओम का नियम एवं संख्यात्मक प्रश्न",
            fileUrl: "./notes/class10_science_ch1.pdf",
            fileSize: "2.4 MB",
            pages: 19,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "maths",
        name: "Mathematics (गणित)",
        icon: "📊",
        color: "#d97706",
        notes: [
          {
            id: "10-math-ch1",
            title: "Chapter 1: Real Numbers",
            hindiTitle: "अध्याय 1: वास्तविक संख्याएँ - यूक्लिड विभाजन प्रमेयिका",
            fileUrl: "./notes/class10_math_ch1.pdf",
            fileSize: "1.7 MB",
            pages: 14,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          },
          {
            id: "10-math-ch8",
            title: "Chapter 8: Introduction to Trigonometry",
            hindiTitle: "अध्याय 8: त्रिकोणमिति का परिचय एवं सर्वसमिकाएँ",
            fileUrl: "./notes/class10_math_ch1.pdf",
            fileSize: "2.6 MB",
            pages: 24,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: true
          }
        ]
      },
      {
        id: "social-science",
        name: "Social Science (सामाजिक विज्ञान)",
        icon: "🏛️",
        color: "#059669",
        notes: [
          {
            id: "10-sst-ch1",
            title: "History Ch 1: The Rise of Nationalism in Europe",
            hindiTitle: "इतिहास अध्याय 1: यूरोप में राष्ट्रवाद का उदय",
            fileUrl: "./notes/class10_science_ch1.pdf",
            fileSize: "2.2 MB",
            pages: 18,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: false
          }
        ]
      },
      {
        id: "hindi",
        name: "Hindi (हिंदी)",
        icon: "📜",
        color: "#dc2626",
        notes: [
          {
            id: "10-hin-ch1",
            title: "नेताजी का चश्मा (स्वयं प्रकाश)",
            hindiTitle: "गद्य खंड: नेताजी का चश्मा - प्रश्न एवं उत्तर",
            fileUrl: "./notes/class10_science_ch1.pdf",
            fileSize: "1.1 MB",
            pages: 10,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      }
    ]
  },

  "11th": {
    name: "Class 11th (+2)",
    hindiName: "कक्षा 11वीं (+2)",
    description: "Intermediate 1st Year (Science, Arts, Commerce) study materials",
    subjects: [
      {
        id: "physics",
        name: "Physics (भौतिक विज्ञान)",
        icon: "🧲",
        color: "#2563eb",
        notes: [
          {
            id: "11-phy-ch1",
            title: "Chapter 1 & 2: Units and Measurements",
            hindiTitle: "इकाई और मापन - महत्वपूर्ण विमीय सूत्र एवं त्रुटि विश्लेषण",
            fileUrl: "./notes/class11_physics_ch1.pdf",
            fileSize: "2.5 MB",
            pages: 22,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          },
          {
            id: "11-phy-ch3",
            title: "Motion in a Straight Line & Vectors",
            hindiTitle: "सरल रेखा में गति एवं सदिश विश्लेषण",
            fileUrl: "./notes/class11_physics_ch1.pdf",
            fileSize: "3.1 MB",
            pages: 28,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "chemistry",
        name: "Chemistry (रसायन विज्ञान)",
        icon: "🧪",
        color: "#0891b2",
        notes: [
          {
            id: "11-chem-ch1",
            title: "Some Basic Concepts of Chemistry",
            hindiTitle: "रसायन विज्ञान की कुछ मूल अवधारणाएँ (मोल संकल्पना)",
            fileUrl: "./notes/class11_physics_ch1.pdf",
            fileSize: "2.4 MB",
            pages: 20,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          }
        ]
      },
      {
        id: "maths",
        name: "Mathematics (गणित)",
        icon: "📈",
        color: "#d97706",
        notes: [
          {
            id: "11-math-ch1",
            title: "Sets, Relations and Functions",
            hindiTitle: "समुच्चय, संबंध एवं फलन - पूर्ण नोट्स",
            fileUrl: "./notes/class11_physics_ch1.pdf",
            fileSize: "2.8 MB",
            pages: 25,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "biology",
        name: "Biology (जीव विज्ञान)",
        icon: "🧬",
        color: "#16a34a",
        notes: [
          {
            id: "11-bio-ch1",
            title: "The Living World & Biological Classification",
            hindiTitle: "जीव जगत एवं जीव जगत का वर्गीकरण",
            fileUrl: "./notes/class11_physics_ch1.pdf",
            fileSize: "3.2 MB",
            pages: 26,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "arts-history",
        name: "History & Geography (Arts / मानविकी)",
        icon: "🏛️",
        color: "#b45309",
        notes: [
          {
            id: "11-art-ch1",
            title: "Themes in World History: From the Beginning of Time",
            hindiTitle: "विश्व इतिहास के कुछ विषय: समय की शुरुआत से",
            fileUrl: "./notes/class11_physics_ch1.pdf",
            fileSize: "2.0 MB",
            pages: 18,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      }
    ]
  },

  "12th": {
    name: "Class 12th (+2)",
    hindiName: "कक्षा 12वीं (+2)",
    description: "Intermediate Final Board Examination study materials & model question banks",
    subjects: [
      {
        id: "physics",
        name: "Physics (भौतिक विज्ञान)",
        icon: "⚛️",
        color: "#2563eb",
        notes: [
          {
            id: "12-phy-ch1",
            title: "Chapter 1: Electric Charges and Fields",
            hindiTitle: "अध्याय 1: वैद्युत आवेश तथा क्षेत्र - गाउस का नियम एवं अनुप्रयोग",
            fileUrl: "./notes/class12_physics_ch1.pdf",
            fileSize: "3.4 MB",
            pages: 30,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          },
          {
            id: "12-phy-ch2",
            title: "Electrostatic Potential and Capacitance",
            hindiTitle: "स्थिरवैद्युत विभव तथा धारिता",
            fileUrl: "./notes/class12_physics_ch1.pdf",
            fileSize: "2.9 MB",
            pages: 25,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: true
          }
        ]
      },
      {
        id: "chemistry",
        name: "Chemistry (रसायन विज्ञान)",
        icon: "⚗️",
        color: "#0891b2",
        notes: [
          {
            id: "12-chem-ch1",
            title: "Solutions (विलयन) - Raoult's Law & Colligative Properties",
            hindiTitle: "विलयन - वाष्प दाब, राउल्ट का नियम एवं अणुसंख्य गुणधर्म",
            fileUrl: "./notes/class12_physics_ch1.pdf",
            fileSize: "2.7 MB",
            pages: 24,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          },
          {
            id: "12-chem-ch2",
            title: "Electrochemistry (वैद्युतरसायन)",
            hindiTitle: "वैद्युतरसायन - नेर्नस्ट समीकरण एवं फैराडे के नियम",
            fileUrl: "./notes/class12_physics_ch1.pdf",
            fileSize: "3.0 MB",
            pages: 27,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "maths",
        name: "Mathematics (गणित)",
        icon: "📐",
        color: "#d97706",
        notes: [
          {
            id: "12-math-ch1",
            title: "Matrices & Determinants (आव्यूह एवं सारणिक)",
            hindiTitle: "आव्यूह एवं सारणिक - गुणधर्म, व्युत्क्रम एवं रैखिक समीकरण",
            fileUrl: "./notes/class12_physics_ch1.pdf",
            fileSize: "3.2 MB",
            pages: 28,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: true
          },
          {
            id: "12-math-ch2",
            title: "Calculus: Continuity & Differentiability",
            hindiTitle: "सांतत्य तथा अवकलनीयता - महत्वपूर्ण प्रश्न",
            fileUrl: "./notes/class12_physics_ch1.pdf",
            fileSize: "3.8 MB",
            pages: 34,
            type: "PDF",
            uploadedAt: "Oct 2025",
            isNew: true
          }
        ]
      },
      {
        id: "biology",
        name: "Biology (जीव विज्ञान)",
        icon: "🔬",
        color: "#16a34a",
        notes: [
          {
            id: "12-bio-ch1",
            title: "Sexual Reproduction in Flowering Plants",
            hindiTitle: "पुष्पी पादपों में लैंगिक जनन",
            fileUrl: "./notes/class12_physics_ch1.pdf",
            fileSize: "2.8 MB",
            pages: 22,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
       {
        id: "arts",
        name: "General",
        icon: "🔬",
        color: "#16a34a",
        notes: [
          {
            id: "12-gen-01",
            title: "General",
            hindiTitle: "general",
            fileUrl: "./notes/class12_physics_ghoshna.pdf",
            fileSize: "2.8 MB",
            pages: 22,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
          }
        ]
      },
      {
        id: "arts",
        name: "Arts & Humanities (राजनीति शास्त्र एवं इतिहास)",
        icon: "📜",
        color: "#b45309",
        notes: [
          {
            id: "12-art-pol1",
            title: "Contemporary World Politics: Cold War Era",
            hindiTitle: "समकालीन विश्व राजनीति: शीतयुद्ध का दौर",
            fileUrl: "./notes/class12_physics_ch1.pdf",
            fileSize: "2.1 MB",
            pages: 18,
            type: "PDF",
            uploadedAt: "Sep 2025",
            isNew: false
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

