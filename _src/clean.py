#!/usr/bin/env python3

import contextlib
import fnmatch
import glob
import os
import shutil

def safe_remove(file_name):
    with contextlib.suppress(FileNotFoundError):
        os.remove(file_name)

def rm_dirs(directory, pattern):
    for root, dirs, _ in os.walk(directory):
        for basename in dirs:
            if fnmatch.fnmatch(basename, pattern):
                shutil.rmtree(os.path.join(root, basename), ignore_errors=True)

def rm_files(directory, pattern):
    for root, _, files in os.walk(directory):
        for basename in files:
            if fnmatch.fnmatch(basename, pattern):
                os.remove(os.path.join(root, basename))

current_path = os.getcwd()

rm_dirs(current_path, "CMakeFiles")
rm_files(current_path + "/src", "*.cmake")

rm_files(current_path, "*ninja*")

# remove VS generated files
rm_files(current_path, "*.sln")
rm_files(current_path, "*.vcxproj*")
rm_dirs(current_path, ".vs")
rm_dirs(current_path, "x64")

# remove xcode generated files
rm_dirs(current_path, "*.xcodeproj")
rm_dirs(current_path, "*.build")
rm_dirs(current_path, "DerivedData")

# remove cmake generated files
safe_remove("cmake_install.cmake")
shutil.rmtree("build", True)
rm_dirs(current_path, "CMakeScripts")
rm_files(current_path, "CMakeCache.txt")
rm_files(current_path, "Makefile")

# remove build generate files
rm_dirs(current_path, "*.dir")
shutil.rmtree("_imd", True)
shutil.rmtree("lib", True)
shutil.rmtree("bin", True)
shutil.rmtree("out", True)
