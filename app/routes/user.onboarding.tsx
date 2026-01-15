import React, { useEffect, useState } from "react";
import {
  data,
  useFetcher,
  useLoaderData,
  useNavigate,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Upload, User, Instagram, BookOpen, Calendar } from "lucide-react";
import z from "zod";
import { appLogger } from "~/lib/logger.server";
import type { ApiResponse } from "~/utilities/types/api.types";
import { toastResponse } from "~/utilities/react.utility";
import { authorizeRequest } from "~/utilities/router.utilty";
import { postgresDB } from "~/database";
import { usersTable } from "~/database/pg.schema";
import { eq } from "drizzle-orm";
import { userProfileTable } from "~/database/pg.schema/tinker.schema";
import { v2 as cloudinary } from "cloudinary";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await authorizeRequest(request, "GET");
  const profile = await postgresDB
    .select({
      name: usersTable.name,
      bio: userProfileTable.bio,
      instagramUsername: userProfileTable.instagramUsername,
      course: userProfileTable.course,
      graduationYear: userProfileTable.graduationYear,
      image: usersTable.image,
    })
    .from(userProfileTable)
    .leftJoin(usersTable, eq(userProfileTable.userId, usersTable.id))
    .where(eq(userProfileTable.userId, session.user.id));

  return data<ApiResponse>({
    success: true,
    message: "User profile fetched successfully",
    data: {
      profile: profile[0],
    },
  });
}

async function uploader(image: File): Promise<string> {
  const buffer = Buffer.from(await image.arrayBuffer());

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "user_profiles",
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            reject(new Error("Cloudinary upload failed"));
            return;
          }
          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}

export async function action({ request }: ActionFunctionArgs) {
  await import("~/lib/cloudinary.server");

  const session = await authorizeRequest(request, "POST");
  const formData = await request.formData();

  const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    bio: z.string().max(200, "Bio must be less than 200 characters"),
    instagramUsername: z
      .string()
      .max(100, "Instagram username must be less than 100 characters"),
    image: z
      .instanceof(File)
      .refine((file) => file.size > 0, "Image is required")
      .refine((file) => file.type.startsWith("image/"), {
        message: "Only image files are allowed",
      })
      .refine((file) => file.size <= 5 * 1024 * 1024, {
        message: "Image must be under 5MB",
      }),
    course: z.string("Please select a valid course"),
    graduationYear: z.number("Please select a valid graduation year"),
  });
  const submission = formSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio"),
    instagramUsername: formData.get("instagramUsername"),
    image: formData.get("image"),
    course: formData.get("course"),
    graduationYear: Number(formData.get("graduationYear")),
  });
  if (!submission.success) {
    return data<ApiResponse>(
      {
        success: false,
        error: {
          message: submission.error.message,
        },
      },
      { status: 400 }
    );
  }

  appLogger.info(submission, "Onboarding submission");

  let imageUrl: string;
  try {
    imageUrl = await uploader(submission.data.image);
  } catch (error) {
    appLogger.error(error, "Cloudinary upload error");
    throw data<ApiResponse>(
      {
        success: false,
        error: {
          message: "Failed to upload image. Please try again.",
        },
      },
      { status: 500 }
    );
  }
  await postgresDB
    .update(usersTable)
    .set({
      verified: true,
    })
    .where(eq(usersTable.id, session.user.id));

  await postgresDB
    .insert(userProfileTable)
    .values({
      userId: session.user.id,
      name: submission.data.name,
      bio: submission.data.bio,
      image: imageUrl!,
      instagramUsername: submission.data.instagramUsername,
      course: submission.data.course,
      graduationYear: submission.data.graduationYear,
    })
    .onConflictDoUpdate({
      target: userProfileTable.userId,
      set: {
        name: submission.data.name,
        bio: submission.data.bio,
        instagramUsername: submission.data.instagramUsername,
        image: imageUrl,
        course: submission.data.course,
        graduationYear: submission.data.graduationYear,
      },
    });

  return data<ApiResponse>(
    {
      success: true,
      message: "Onboarding completed successfully!",
    },
    { status: 200 }
  );
}

export default function Page() {
  const loaderData = useLoaderData();
  const navigate = useNavigate();
  const fetcher = useFetcher<ApiResponse>();
  const [formData, setFormData] = useState(
    loaderData.data.profile || {
      name: "",
      bio: "",
      instagramUsername: "",
      image: null,
      course: "",
      graduationYear: null,
    }
  );
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState<{
    name: string;
    bio: string;
    instagramUsername: string;
    image: string;
    course: string;
    graduationYear: string;
  }>({
    name: "",
    bio: "",
    instagramUsername: "",
    image: "",
    course: "",
    graduationYear: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courses = [
    "Computer Engineering",
    "Artificial Intelligence & Data Science",
    "Computer Science & Enginneering",
    "Electronics & Computer Engineering",
    "Mechanical Engineering",
  ];

  const graduationYears = [2026, 2027, 2028, 2029];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors?.name) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          image: "Please select a valid image file",
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          image: "Image size should be less than 5MB",
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, image: file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      if (errors.image) {
        setErrors((prev) => ({ ...prev, image: "" }));
      }
    }
  };

  useEffect(() => {
    if (fetcher.data) toastResponse(fetcher.data);
    if (fetcher.data?.success) {
      navigate("/user/home");
    }
  }, [fetcher.data]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            Welcome Aboard!
          </CardTitle>
          <CardDescription className="text-center text-base">
            Let's set up your profile to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <fetcher.Form
            method="post"
            encType="multipart/form-data"
            className="space-y-6"
          >
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Instagram Username */}
            <div className="space-y-2">
              <Label
                htmlFor="instagramUsername"
                className="flex items-center gap-2"
              >
                <Instagram className="w-4 h-4" />
                Instagram Username
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  @
                </span>
                <Input
                  id="instagramUsername"
                  name="instagramUsername"
                  type="text"
                  placeholder="username"
                  value={formData.instagramUsername}
                  onChange={handleInputChange}
                  className={`pl-8 ${errors.instagramUsername ? "border-red-500" : ""}`}
                />
              </div>
              {errors.instagramUsername && (
                <p className="text-sm text-red-500">
                  {errors.instagramUsername}
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Short Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell us a bit about yourself..."
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className={errors.bio ? "border-red-500" : ""}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  {formData.bio.length}/200 characters
                </p>
                {errors.bio && (
                  <p className="text-sm text-red-500">{errors.bio}</p>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Profile Image (9:16 ratio)
              </Label>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 w-full">
                  <Input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className={errors.image ? "border-red-500" : ""}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: 9:16 aspect ratio (e.g., 1080x1920px)
                  </p>
                </div>
                {imagePreview && (
                  <div className="w-24 h-36 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              {errors.image && (
                <p className="text-sm text-red-500">{errors.image}</p>
              )}
            </div>

            {/* Course */}
            <div className="space-y-2">
              <Label htmlFor="course" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Course
              </Label>
              <Select
                value={formData.course}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, course: value }));
                  if (errors.course) {
                    setErrors((prev) => ({ ...prev, course: "" }));
                  }
                }}
              >
                <SelectTrigger
                  className={errors.course ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select your course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="course" value={formData.course} />
              {errors.course && (
                <p className="text-sm text-red-500">{errors.course}</p>
              )}
            </div>

            {/* Graduation Year */}
            <div className="space-y-2">
              <Label
                htmlFor="graduationYear"
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Expected Graduation Year
              </Label>
              <Select
                value={formData.graduationYear}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, graduationYear: value }));
                  if (errors.graduationYear) {
                    setErrors((prev) => ({ ...prev, graduationYear: "" }));
                  }
                }}
              >
                <SelectTrigger
                  className={errors.graduationYear ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select graduation year" />
                </SelectTrigger>
                <SelectContent>
                  {graduationYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                name="graduationYear"
                value={formData.graduationYear}
              />
              {errors.graduationYear && (
                <p className="text-sm text-red-500">{errors.graduationYear}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Complete Onboarding"}
            </Button>
          </fetcher.Form>
        </CardContent>
      </Card>
    </div>
  );
}
