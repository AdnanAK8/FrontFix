from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import JSONResponse
from ..services.engine import DiagnosticEngine
from ..services.sanitizer import SanitizerService
from ..utils.formatter import format_diagnostic_response


def create_diagnostics_router(engine: DiagnosticEngine) -> APIRouter:
    diagnostics_router = APIRouter()

    @diagnostics_router.post("/upload-log")
    async def upload_log(file: UploadFile = File(None)):
        if not file:
            return JSONResponse(status_code=400, content={"detail": "No file uploaded."})

        contents = await file.read()
        if not contents or len(contents) == 0:
            return JSONResponse(status_code=400, content={"detail": "Uploaded file is empty."})

        if len(contents) > 2 * 1024 * 1024:
            return JSONResponse(
                status_code=413,
                content={"detail": "File exceeds maximum allowed size of 2MB."},
            )

        preview = contents[: min(len(contents), 1024)]
        if b"\x00" in preview:
            return JSONResponse(
                status_code=400,
                content={"detail": "Binary or executable file detected. Please upload a plain text (.log, .txt, .json) file."},
            )

        try:
            content_text = contents.decode("utf-8")
        except UnicodeDecodeError:
            content_text = contents.decode("utf-8", errors="replace")

        analysis = await engine.analyze_log_file(content_text)

        return {
            "success": True,
            "filename": file.filename or "uploaded.log",
            "analysis": analysis,
        }

    @diagnostics_router.post("/extension/diagnose")
    async def diagnose_extension(request: Request):
        try:
            body = await request.json()
        except Exception:
            return JSONResponse(status_code=400, content={"detail": "Invalid request body."})

        if not isinstance(body, dict):
            return JSONResponse(status_code=400, content={"detail": "Invalid request body."})

        url = body.get("url", "")
        error_message = body.get("errorMessage", "")
        stack = body.get("stack", "")
        promise_rejection = body.get("promiseRejection", "")
        failed_resource_url = body.get("failedResourceUrl", "")
        browser_info = body.get("browserInfo", "")
        user_description = body.get("userDescription", "")
        selected_text = body.get("selectedText", "")
        detected_framework = body.get("detectedFramework")

        has_diagnostic_info = bool(
            (isinstance(error_message, str) and error_message.strip())
            or (isinstance(body.get("query"), str) and body.get("query").strip())
            or (isinstance(stack, str) and stack.strip())
            or (isinstance(promise_rejection, str) and promise_rejection.strip())
            or (isinstance(user_description, str) and user_description.strip())
            or (isinstance(selected_text, str) and selected_text.strip())
            or (isinstance(failed_resource_url, str) and failed_resource_url.strip())
        )

        if not has_diagnostic_info:
            return JSONResponse(
                status_code=400,
                content={"detail": "At least one diagnostic error message, description, or stack trace is required."},
            )

        clean_url = SanitizerService.sanitize_url(url)
        clean_failed_url = SanitizerService.sanitize_url(failed_resource_url)

        query_parts = []
        if error_message and isinstance(error_message, str) and error_message.strip():
            query_parts.append(error_message.strip())
        if promise_rejection and isinstance(promise_rejection, str) and promise_rejection.strip():
            query_parts.append(f"Unhandled Rejection: {promise_rejection.strip()}")
        if selected_text and isinstance(selected_text, str) and selected_text.strip():
            query_parts.append(f"Selected Code:\n{selected_text.strip()}")
        if user_description and isinstance(user_description, str) and user_description.strip():
            query_parts.append(f"User Note: {user_description.strip()}")
        if clean_failed_url and isinstance(clean_failed_url, str) and clean_failed_url.strip():
            query_parts.append(f"Failed Resource: {clean_failed_url.strip()}")

        full_query = "\n\n".join(query_parts).strip()

        context = {
            "stack": stack,
            "errorMessage": error_message,
            "promiseRejection": promise_rejection,
            "failedResourceUrl": clean_failed_url,
            "browserInfo": browser_info,
            "selectedText": selected_text,
            "detectedFramework": detected_framework,
            "source": "extension_capture",
            "isBrowserCaptured": bool(error_message or promise_rejection or clean_failed_url),
        }

        diagnosis = await engine.diagnose(full_query, True, None, context)
        formatted = format_diagnostic_response(diagnosis)

        return {
            "success": True,
            "data": formatted,
            "browser_context": {
                "url": clean_url,
                "browserInfo": (browser_info or "")[:200],
                "detectedFramework": diagnosis.get("evidence_summary", {}).get("detected_framework", "Unknown"),
                "fileLocation": diagnosis.get("evidence_summary", {}).get("file_location"),
            },
        }

    return diagnostics_router
