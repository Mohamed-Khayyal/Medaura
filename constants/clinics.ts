export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  experience: number;
  price: number;
  imageSrc: string;
  rating: number;
  gender: "male" | "female";
  about?: string;
}

export interface Review {
  id: number;
  name: string;
  date: string;
  comment: string;
  rating: number;
}

export interface Clinic {
  id: number;
  name: string;
  city: string;
  address: string;
  phone: string;
  rating: number;
  hours: string;
  specialties: string[];
  image: string;
  doctors: Doctor[];
  reviews: Review[];
}

export const allClinics: Clinic[] = Array.from({ length: 18 }).map(
  (_, index) => {
    const clinicId = index + 1;
    const type = index % 3;

    let name = "";
    let specialties: string[] = [];
    let image = "";
    let address = "123 Salah Salem St, Cairo";

    if (type === 0) {
      name = "Heart Medical Center";
      specialties = ["Cardiology", "Heart Surgery", "Catheterization"];
      image = "/images/clinic 1.jpg";
    } else if (type === 1) {
      name = "Al Noor Specialized Hospital";
      specialties = ["Internal Medicine", "General Surgery", "Emergency"];
      image = "/images/clinic 2.jpg";
    } else {
      name = "Advanced Orthopedics Clinic";
      specialties = ["Orthopedics", "Physical Therapy", "Rheumatology"];
      image = "/images/clinic 3.jpg";
    }

    return {
      id: clinicId,
      name,
      city: "Cairo",
      address,
      phone: "+201134569034",
      rating: 4.9,
      hours: "Mon - Fri 9:00 AM - 6:00 PM",
      specialties,
      image,
      doctors: [
        {
          id: 1,
          name: "Dr. Saleh Mahmoud",
          specialty: specialties[0],
          experience: 8,
          price: 350,
          imageSrc: "/images/doc1.jpg",
          rating: 4.9,
          gender: "male",
          about:
            "Distinguished consultant in his specialty, fellow of the Royal College, with extensive experience in providing advanced medical care.",
        },
        {
          id: 2,
          name: "Dr. Nadine Adel",
          specialty: specialties[1] || specialties[0],
          experience: 7,
          price: 280,
          imageSrc: "/images/doc3.jpg",
          rating: 4.9,
          gender: "female",
          about:
            "Highly efficient specialist, pays attention to the smallest details in diagnosing and treating patients using the latest medical means.",
        },
        {
          id: 3,
          name: "Dr. Karim Mohamed",
          specialty: specialties[2] || specialties[0],
          experience: 10,
          price: 320,
          imageSrc: "/images/doc2.jpg",
          rating: 4.8,
          gender: "male",
          about:
            "Specialized consultant with over 10 years of experience, known for professional precision and dedication to patient service.",
        },
      ],
      reviews: [
        {
          id: 1,
          name: "Mohamed A. M. 38y",
          date: "Tuesday, Dec 30, 2025 9:30 AM",
          comment:
            "Respectful and very knowledgeable, gave me enough time to listen to my complaints and answer all my questions.",
          rating: 5,
        },
        {
          id: 2,
          name: "Fatima A. H. 45y",
          date: "Monday, Dec 29, 2025 11:00 AM",
          comment:
            "Very wonderful experience, the doctor is specialized and very kind, I highly recommend him.",
          rating: 5,
        },
        {
          id: 3,
          name: "Ahmed S. K. 52y",
          date: "Sunday, Dec 28, 2025 3:30 PM",
          comment:
            "Excellent service and reasonable price, I will definitely come back again.",
          rating: 5,
        },
        {
          id: 4,
          name: "Sara M. J. 32y",
          date: "Saturday, Dec 27, 2025 10:15 AM",
          comment:
            "The doctor listened to me with interest and explained everything clearly, I felt comfortable and confident.",
          rating: 5,
        },
      ],
    };
  },
);

// Best Doctors for Home Page - Distributed across different clinics
export const bestDoctors = [
  {
    id: 1,
    clinicId: 1,
    name: "Dr. Saleh Mahmoud",
    specialty: "Cardiology",
    experience: 8,
    price: 350,
    imageSrc: "/images/doc1.jpg",
    rating: 4.9,
    gender: "male",
  },
  {
    id: 2,
    clinicId: 2,
    name: "Dr. Nadine Adel",
    specialty: "Internal Medicine",
    experience: 7,
    price: 280,
    imageSrc: "/images/doc3.jpg",
    rating: 4.9,
    gender: "female",
  },
  {
    id: 3,
    clinicId: 3,
    name: "Dr. Karim Mohamed",
    specialty: "Orthopedics",
    experience: 10,
    price: 320,
    imageSrc: "/images/doc2.jpg",
    rating: 4.8,
    gender: "male",
  },
];
