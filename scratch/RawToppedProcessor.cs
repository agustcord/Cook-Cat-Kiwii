using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class RawToppedProcessor
{
    public static void ConvertJpegToTransparentPng(string inputPath, string outputPath, int finalSize = 128, int tolerance = 24)
    {
        using (var source = new Bitmap(inputPath))
        using (var working = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(working))
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceOver;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.SmoothingMode = SmoothingMode.HighQuality;
                graphics.DrawImage(source, 0, 0, source.Width, source.Height);
            }

            RemoveConnectedNearWhiteBackground(working, tolerance);

            using (var resized = ResizeTransparentBitmap(working, finalSize, finalSize))
            {
                var parent = Path.GetDirectoryName(outputPath);
                if (!string.IsNullOrEmpty(parent))
                {
                    Directory.CreateDirectory(parent);
                }

                resized.Save(outputPath, ImageFormat.Png);
            }
        }
    }

    private static void RemoveConnectedNearWhiteBackground(Bitmap bitmap, int tolerance)
    {
        int width = bitmap.Width;
        int height = bitmap.Height;
        var visited = new bool[width, height];
        var queue = new Queue<Point>();

        Enqueue(queue, 0, 0, width, height);
        Enqueue(queue, width - 1, 0, width, height);
        Enqueue(queue, 0, height - 1, width, height);
        Enqueue(queue, width - 1, height - 1, width, height);

        while (queue.Count > 0)
        {
            var point = queue.Dequeue();
            int x = point.X;
            int y = point.Y;

            if (visited[x, y])
            {
                continue;
            }

            visited[x, y] = true;
            var color = bitmap.GetPixel(x, y);

            if (!IsNearWhiteBackground(color, tolerance))
            {
                continue;
            }

            bitmap.SetPixel(x, y, Color.FromArgb(0, color.R, color.G, color.B));

            Enqueue(queue, x + 1, y, width, height);
            Enqueue(queue, x - 1, y, width, height);
            Enqueue(queue, x, y + 1, width, height);
            Enqueue(queue, x, y - 1, width, height);
        }
    }

    private static bool IsNearWhiteBackground(Color color, int tolerance)
    {
        if (color.A == 0)
        {
            return true;
        }

        int average = (color.R + color.G + color.B) / 3;
        int max = Math.Max(color.R, Math.Max(color.G, color.B));
        int min = Math.Min(color.R, Math.Min(color.G, color.B));

        bool nearWhite = (255 - color.R) <= tolerance
            && (255 - color.G) <= tolerance
            && (255 - color.B) <= tolerance;

        bool lowSaturation = (max - min) <= 12;
        bool brightEnough = average >= 235;

        return nearWhite && lowSaturation && brightEnough;
    }

    private static Bitmap ResizeTransparentBitmap(Bitmap source, int width, int height)
    {
        var output = new Bitmap(width, height, PixelFormat.Format32bppArgb);

        using (var graphics = Graphics.FromImage(output))
        {
            graphics.Clear(Color.Transparent);
            graphics.CompositingMode = CompositingMode.SourceOver;
            graphics.CompositingQuality = CompositingQuality.HighQuality;
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
            graphics.SmoothingMode = SmoothingMode.HighQuality;
            graphics.DrawImage(source, new Rectangle(0, 0, width, height));
        }

        return output;
    }

    private static void Enqueue(Queue<Point> queue, int x, int y, int width, int height)
    {
        if (x >= 0 && y >= 0 && x < width && y < height)
        {
            queue.Enqueue(new Point(x, y));
        }
    }
}
