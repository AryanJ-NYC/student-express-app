-- CreateTable
CREATE TABLE "Student" (
    "sId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "school" TEXT NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("sId")
);
