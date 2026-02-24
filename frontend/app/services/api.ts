export async function uploadReport(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://localhost:8000/upload/", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  return res.json(); // { file_id }
}

export async function analyzeReport(
  fileId: string,
  gender: "male" | "female"
) {
  const res = await fetch(
    `http://localhost:8000/analyze/?file_id=${encodeURIComponent(
      fileId
    )}&gender=${gender}`,
    { method: "POST" }
  );

  if (!res.ok) {
    throw new Error("Analysis failed");
  }

  const data = await res.json();
  const raw = data.final_results || {};

  const parameters = Object.entries(raw).map(
    ([name, p]: [string, any]) => ({
      name,
      gender,
      value: p.value,
      unit: p.unit,
      status: p.status,            // backend decided
      min: p.normal_range?.min ?? null,
      max: p.normal_range?.max ?? null,
    })
  );

  return {
    summary: "",
    lifestyle: [],
    parameters,
  };
}