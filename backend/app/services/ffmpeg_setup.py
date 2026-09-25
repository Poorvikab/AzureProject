import os
import shutil
import stat
import tempfile
import warnings
import imageio_ffmpeg

# 1. Immediately silence the pydub ffmpeg/avconv warning before any import can trigger it
warnings.filterwarnings(
    "ignore",
    message=".*Couldn't find ffmpeg or avconv.*",
    category=RuntimeWarning,
)
warnings.filterwarnings(
    "ignore",
    category=RuntimeWarning,
    module=r"pydub(\..*)?",
)


def ensure_ffmpeg() -> str:
    """
    Ensures that standard 'ffmpeg' and 'ffprobe' executables exist on PATH,
    sourced from the imageio-ffmpeg bundled binary.
    Works seamlessly on both Linux (Azure App Service) and Windows.
    """
    raw_exe = imageio_ffmpeg.get_ffmpeg_exe()
    exe_dir = os.path.dirname(raw_exe)

    is_windows = os.name == "nt"
    ffmpeg_name = "ffmpeg.exe" if is_windows else "ffmpeg"
    ffprobe_name = "ffprobe.exe" if is_windows else "ffprobe"

    # Try creating aliases in the same directory as the imageio binary first.
    # If the site-packages directory is read-only, fallback to a temp directory.
    target_dir = exe_dir
    try:
        test_file = os.path.join(target_dir, ".write_test")
        with open(test_file, "w") as f:
            f.write("ok")
        os.remove(test_file)
    except OSError:
        target_dir = os.path.join(tempfile.gettempdir(), "ffmpeg_bin")
        os.makedirs(target_dir, exist_ok=True)

    for alias_name in (ffmpeg_name, ffprobe_name):
        alias_path = os.path.join(target_dir, alias_name)
        if not os.path.exists(alias_path):
            try:
                # Try symlink first (lightweight, zero disk overhead)
                os.symlink(raw_exe, alias_path)
            except (OSError, NotImplementedError, AttributeError):
                try:
                    # Fallback to hardlink
                    os.link(raw_exe, alias_path)
                except (OSError, NotImplementedError, AttributeError):
                    # Fallback to copy
                    shutil.copyfile(raw_exe, alias_path)

            # Ensure executable permissions on Linux/macOS
            if not is_windows:
                try:
                    current_mode = os.stat(alias_path).st_mode
                    os.chmod(alias_path, current_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
                except OSError:
                    pass

    # Ensure target_dir is at the front of PATH
    current_path = os.environ.get("PATH", "")
    if target_dir not in current_path.split(os.pathsep):
        os.environ["PATH"] = target_dir + os.pathsep + current_path

    resolved_ffmpeg = os.path.join(target_dir, ffmpeg_name)
    resolved_ffprobe = os.path.join(target_dir, ffprobe_name)

    os.environ["FFMPEG_BINARY"] = resolved_ffmpeg
    os.environ["FFPROBE_BINARY"] = resolved_ffprobe

    # If pydub is installed, configure it directly
    try:
        from pydub import AudioSegment  # noqa: F401
        AudioSegment.converter = resolved_ffmpeg
        AudioSegment.ffmpeg = resolved_ffmpeg
        AudioSegment.ffprobe = resolved_ffprobe
    except Exception:
        pass

    return resolved_ffmpeg


# Run once on module import so it's active immediately
FFMPEG_PATH = ensure_ffmpeg()
